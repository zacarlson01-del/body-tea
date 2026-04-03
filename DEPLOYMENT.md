# ISEA Authentication System - Setup & Deployment Guide

## Quick Start

### Development Environment Setup

#### 1. Backend Setup (5 minutes)
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your local database credentials

# Create PostgreSQL database
createdb -U postgres isea_db
createdb -U postgres -O isea_user isea_db

# Run migrations
psql -U isea_user -d isea_db -f src/db/schema.sql

# Start dev server
npm run dev
# Server runs on http://localhost:5000
```

#### 2. Frontend Setup (5 minutes)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
# App runs on http://localhost:3000
```

#### 3. Test the System
1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" tab
3. Fill in the form with test data
4. Upload a profile picture (optional)
5. Click "Create Account"
6. You'll be redirected to the dashboard

---

## Production Deployment

### Prerequisites
- PostgreSQL 12+ via AWS RDS or managed database
- Node.js 18+ hosting (Heroku, Render, AWS Lambda, DigitalOcean)
- React hosting (Vercel, Netlify, AWS S3 + CloudFront)
- AWS S3 bucket for profile pictures (or alternative cloud storage)

### Backend Deployment

#### Step 1: Prepare for Production
```bash
cd backend
npm install --production
npm run build
```

#### Step 2: Set Production Environment Variables
```env
# Database (use managed service URL)
DB_HOST=your-db.rds.amazonaws.com
DB_PORT=5432
DB_NAME=isea_prod
DB_USER=isea_user
DB_PASSWORD=<strong-random-password>

# JWT (generate long random strings)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=production

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=isea-profiles-prod
AWS_S3_URL=https://isea-profiles-prod.s3.amazonaws.com

# Frontend (your production domain)
FRONTEND_URL=https://app.isea.com
```

#### Step 3: Deploy Backend
**Option A: Heroku**
```bash
heroku login
heroku create isea-backend
heroku config:set JWT_SECRET=<your-secret>
# ... set all environment variables
git push heroku main
```

**Option B: AWS Elastic Beanstalk**
```bash
# Create .ebextensions/nodecommand.config
eb init
eb create isea-backend-env
eb deploy
```

**Option C: DigitalOcean App Platform**
- Connect GitHub repository
- Configure environment variables
- Deploy via DigitalOcean dashboard

### Frontend Deployment

#### Step 1: Build for Production
```bash
cd frontend
npm run build
# Creates build/ directory with optimized assets
```

#### Step 2: Configure Environment
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

#### Step 3: Deploy
**Option A: Vercel** (Recommended for React)
```bash
npm install -g vercel
vercel --prod
```

**Option B: Netlify**
```bash
npm run build
netlify deploy --prod --dir=build
```

**Option C: AWS S3 + CloudFront**
```bash
aws s3 sync build/ s3://isea-frontend-prod
# Configure CloudFront to point to S3 bucket
```

---

## Database Migration

### Local Development
```bash
# Create database
createdb isea_db

# Run schema
psql -U postgres -d isea_db -f backend/src/db/schema.sql
```

### Production (AWS RDS)
```bash
# Connect to RDS
psql -h your-db.rds.amazonaws.com -U isea_user -d isea_prod -f schema.sql

# Or use AWS CLI if using CloudFormation
aws rds-data execute-statement \
  --resource-arn arn:aws:rds:region:account:cluster:cluster-name \
  --database isea_prod \
  --sql file://backend/src/db/schema.sql
```

---

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health endpoint
curl https://your-backend.com/health

# Database connection test
psql -h your-db-host -U isea_user -d isea_prod -c "SELECT 1;"
```

### Log Monitoring
```bash
# View backend logs (Heroku)
heroku logs --tail

# View AWS Elastic Beanstalk logs
eb logs
```

### Database Maintenance
```bash
# Check database size
SELECT pg_size_pretty(pg_database_size('isea_prod'));

# View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;

# Cleanup expired tokens (run weekly)
DELETE FROM refresh_tokens WHERE expires_at < NOW();
```

---

## Backup & Recovery

### PostgreSQL Backup
```bash
# Create backup
pg_dump -h your-db-host -U isea_user isea_prod > backup.sql

# Restore from backup
psql -h your-db-host -U isea_user isea_prod < backup.sql

# AWS RDS automated backups
# Configure in AWS RDS console or CLI
aws rds create-db-snapshot \
  --db-instance-identifier isea-db \
  --db-snapshot-identifier isea-backup-$(date +%Y%m%d)
```

### S3 Profile Picture Backup
```bash
# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket isea-profiles-prod \
  --versioning-configuration Status=Enabled

# Setup lifecycle policy for old versions
aws s3api put-bucket-lifecycle-configuration \
  --bucket isea-profiles-prod \
  --lifecycle-configuration file://lifecycle.json
```

---

## Security Hardening

### 1. SSL/TLS Certificates
```bash
# Heroku (automatic)
heroku certs:auto enable

# AWS Elastic Beanstalk
# Use AWS Certificate Manager for free SSL

# Manual with Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

### 2. Rate Limiting (Add to backend)
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/auth', limiter);
```

### 3. Database Encryption
```bash
# AWS RDS encryption at rest
aws rds modify-db-instance \
  --db-instance-identifier isea-db \
  --storage-encrypted
```

### 4. Secrets Management
```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name isea/prod/DB_PASSWORD \
  --secret-string "your-password"
```

---

## Performance Optimization

### Frontend
- Enable Gzip compression in build
- Lazy load components
- Optimize images (profile pictures already optimized with Sharp)
- Use CDN for static assets

### Backend
```typescript
// Add compression middleware
import compression from 'compression';
app.use(compression());

// Connection pooling (already configured in db.ts)
const pool = new Pool({
  max: 20, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000,
});
```

### Database
```sql
-- Add indexes on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_escrow_user_id ON escrow_accounts(user_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Monitor slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();
```

---

## Troubleshooting Deployment

### Backend Won't Start
```bash
# Check Node version
node --version # Should be 18+

# Check dependencies
npm ls

# Check environment variables
env | grep JWT

# Review logs
npm run dev 2>&1 | head -50
```

### Database Connection Error
```bash
# Test connection
psql -h your-db-host -U isea_user -d isea_prod -c "SELECT 1;"

# Check security group/firewall
# Ensure database port (5432) is accessible from backend
```

### CORS Issues
```bash
# Backend console shows CORS error?
# Frontend baseURL in .env must match FRONTEND_URL in backend .env

# Test
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  https://your-backend.com/api/auth/signin
```

### S3 Upload Fails
```bash
# Check S3 bucket permissions
aws s3api get-bucket-acl --bucket isea-profiles-prod

# Check IAM user permissions
# Ensure s3:PutObject and s3:DeleteObject are allowed

# Test upload manually
aws s3 cp test.jpg s3://isea-profiles-prod/test.jpg
```

---

## Cost Optimization

### Database
- Use AWS RDS free tier for testing
- Switch to managed Aurora for production
- Enable auto-scaling for read replicas

### Storage
- Use S3 Intelligent-Tiering for profile pictures
- Archive old files after 1 year
- Estimate: ~5MB per user × 10,000 users = 50GB ≈ $1.15/month

### Compute
- Heroku starter tier: $7/month (development)
- AWS EC2 t3.micro: Free tier eligible
- Vercel/Netlify frontend: Free tier

### Bandwidth
- Estimate: ~100MB/month for 1,000 active users
- Cost: ~$0.09/month (S3 egress)

---

## Production Checklist

- [ ] Database backed up and encrypted
- [ ] HTTPS/SSL enabled on both frontend and backend
- [ ] Environment variables configured correctly
- [ ] Logging and monitoring enabled
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Database indexes created
- [ ] S3 bucket properly secured (no public-write)
- [ ] WAF (Web Application Firewall) enabled for backend
- [ ] Regular backup schedule configured
- [ ] Team alerted to monitoring dashboard
- [ ] Disaster recovery plan documented

---

## Support & Resources

- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS Deployment Guide](https://aws.amazon.com/getting-started/hands-on/deploy-nodejs-web-app/)
- [React Deployment](https://create-react-app.dev/deployment/)
