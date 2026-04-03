import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import {
  signup,
  signin,
  refreshToken,
  getCurrentUser,
  updateProfile,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Multer configuration for profile picture upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`));
    }
  },
});

// Validation middleware
const signupValidation = [
  body('email').isEmail().normalizeEmail().trim(),
  body('first_name').notEmpty().trim().escape(),
  body('last_name').notEmpty().trim().escape(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain a special character'),
  body('phone').optional().isMobilePhone().trim(),
  body('gender').optional().trim().escape(),
  body('date_of_birth').optional().isISO8601(),
  body('affiliated_authorities').optional().trim().escape(),
  body('postal_code').optional().trim().escape(),
];

const signinValidation = [
  body('username_or_email').notEmpty().trim(),
  body('password').notEmpty(),
];

// Routes
router.post('/signup', upload.single('profile_picture'), signupValidation, signup);
router.post('/signin', signinValidation, signin);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);

export default router;
