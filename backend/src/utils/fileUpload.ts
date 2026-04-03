import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

interface UploadOptions {
  userId: string;
  folder?: string;
}

export async function uploadProfilePicture(
  fileBuffer: Buffer,
  fileType: string,
  options: UploadOptions
): Promise<{ url: string; fileName: string; fileSize: number }> {
  // Validate file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
  if (!allowedTypes.includes(fileType)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size (default 5MB)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
  if (fileBuffer.length > maxSize) {
    throw new Error(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`);
  }

  // Optimize image with Sharp
  const optimizedBuffer = await sharp(fileBuffer)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();

  const fileName = `${options.userId}/${options.folder || 'profile'}-${uuidv4()}.webp`;
  const bucketName = process.env.AWS_S3_BUCKET || 'isea-profiles';

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: optimizedBuffer,
    ContentType: 'image/webp',
    ACL: 'public-read' as const,
    CacheControl: 'max-age=86400', // Cache for 1 day
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      url: result.Location,
      fileName: fileName,
      fileSize: optimizedBuffer.length,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload profile picture');
  }
}

export async function deleteProfilePicture(fileName: string): Promise<void> {
  const bucketName = process.env.AWS_S3_BUCKET || 'isea-profiles';

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete profile picture');
  }
}

// For local file storage (alternative to S3)
export async function saveProfilePictureLocal(
  fileBuffer: Buffer,
  userId: string
): Promise<string> {
  const fs = await import('fs').then(m => m.promises);
  const path = await import('path');

  // Optimize image
  const optimizedBuffer = await sharp(fileBuffer)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();

  const fileName = `${userId}-${uuidv4()}.webp`;
  const filePath = path.join(process.cwd(), 'uploads', 'profiles', fileName);

  // Create directories if they don't exist
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, optimizedBuffer);

  // Return relative URL
  return `/uploads/profiles/${fileName}`;
}
