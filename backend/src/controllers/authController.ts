import { Request, Response } from 'express';
import { query } from '../db/db';
import { 
  hashPassword, 
  comparePasswords, 
  generateTokenPair, 
  generateAccountId,
  hashPassword as hashToken 
} from '../utils/auth';
import { uploadProfilePicture, saveProfilePictureLocal } from '../utils/fileUpload';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

interface SignupRequest extends AuthRequest {
  body: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
    affiliated_authorities?: string;
    postal_code?: string;
  };
  file?: Express.Multer.File;
}

interface SigninRequest extends Request {
  body: {
    username_or_email: string;
    password: string;
  };
}

interface RefreshRequest extends Request {
  body: {
    refreshToken: string;
  };
}

// Signup controller
export async function signup(req: SignupRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, 
      first_name, 
      last_name, 
      password, 
      phone, 
      gender, 
      date_of_birth, 
      affiliated_authorities, 
      postal_code 
    } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Upload profile picture if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Use local storage if S3 not configured
        if (process.env.AWS_S3_BUCKET) {
          const upload = await uploadProfilePicture(req.file.buffer, req.file.mimetype, {
            userId: 'temp', // Will be replaced with actual userId after user creation
          });
          profilePictureUrl = upload.url;
        } else {
          // Fallback to local storage
          profilePictureUrl = `/uploads/profiles/${Date.now()}-${req.file.originalname}`;
        }
      } catch (error: any) {
        console.warn('Profile picture upload failed:', error.message);
        // Don't fail signup if profile picture upload fails
      }
    }

    // Generate account ID
    const accountId = generateAccountId();

    // Insert user
    const userResult = await query(
      `INSERT INTO users (
        email, first_name, last_name, password_hash, phone, 
        gender, date_of_birth, affiliated_authorities, postal_code, profile_picture_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, first_name, last_name`,
      [
        email,
        first_name,
        last_name,
        passwordHash,
        phone || null,
        gender || null,
        date_of_birth || null,
        affiliated_authorities || null,
        postal_code || null,
        profilePictureUrl,
      ]
    );

    const userId = userResult.rows[0].id;

    // Create escrow account for the user
    await query(
      `INSERT INTO escrow_accounts (user_id, account_id, status, account_status)
       VALUES ($1, $2, $3, $4)`,
      [userId, accountId, 'pending', 'pending']
    );

    // Log signup action
    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'signup', 'success', req.ip || 'unknown']
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      userId,
      email,
      `${first_name} ${last_name}`
    );

    // Store refresh token hash in database
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email: userResult.rows[0].email,
        first_name: userResult.rows[0].first_name,
        last_name: userResult.rows[0].last_name,
        profile_picture_url: profilePictureUrl,
      },
      accessToken,
      refreshToken,
      accountId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

// Signin controller
export async function signin(req: SigninRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username_or_email, password } = req.body;

    // Find user by email or username
    const userResult = await query(
      `SELECT id, email, username, password_hash, first_name, last_name, profile_picture_url
       FROM users 
       WHERE email = $1 OR username = $1`,
      [username_or_email]
    );

    if (userResult.rows.length === 0) {
      // Log failed attempt
      await query(
        `INSERT INTO audit_logs (action, status, ip_address, details)
         VALUES ($1, $2, $3, $4)`,
        ['signin', 'failed', req.ip || 'unknown', JSON.stringify({ reason: 'user_not_found' })]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const passwordMatch = await comparePasswords(password, user.password_hash);
    if (!passwordMatch) {
      // Log failed attempt
      await query(
        `INSERT INTO audit_logs (user_id, action, status, ip_address, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'signin', 'failed', req.ip || 'unknown', JSON.stringify({ reason: 'invalid_password' })]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      user.email,
      user.username
    );

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // Log successful signin
    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'signin', 'success', req.ip || 'unknown']
    );

    // Fetch escrow account
    const accountResult = await query(
      `SELECT account_id FROM escrow_accounts WHERE user_id = $1`,
      [user.id]
    );

    res.status(200).json({
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
      },
      accessToken,
      refreshToken,
      accountId: accountResult.rows[0]?.account_id || null,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Refresh token controller
export async function refreshToken(req: RefreshRequest, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify token hash exists and is not expired
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenResult = await query(
      `SELECT user_id FROM refresh_tokens 
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Fetch user
    const userResult = await query(
      `SELECT id, email, username FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(
      user.id,
      user.email,
      user.username
    );

    // Store new refresh token hash
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Delete old token and insert new one
    await query(
      `DELETE FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, newTokenHash, expiresAt]
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}

// Get current user
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userResult = await query(
      `SELECT id, email, username, first_name, last_name, phone, gender, 
              date_of_birth, profile_picture_url, affiliated_authorities, postal_code
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch escrow account
    const accountResult = await query(
      `SELECT account_id, account_status, escrow_deposit_amount, duration_days 
       FROM escrow_accounts WHERE user_id = $1`,
      [req.userId]
    );

    res.status(200).json({
      user,
      escrowAccount: accountResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
}

// Update profile
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { first_name, last_name, phone, gender, postal_code } = req.body;

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (postal_code !== undefined) {
      updates.push(`postal_code = $${paramCount++}`);
      values.push(postal_code);
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.userId);

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(updateQuery, values);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
