# Cloud Services Setup Guide

This guide will help you set up cloud-based MongoDB and file storage for your Medical Record System.

---

## Option 1: MongoDB Atlas (Cloud MongoDB)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (Free tier available)

### Step 2: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/medical-records?retryWrites=true&w=majority
   ```

### Step 3: Update Backend .env
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/medical-records?retryWrites=true&w=majority
```

**Replace:**
- `your-username` with your Atlas username
- `your-password` with your Atlas password
- `cluster0.xxxxx` with your actual cluster address

---

## Option 2: Local MongoDB

### Windows Installation
```bash
# Download from: https://www.mongodb.com/try/download/community

# Or use Chocolatey:
choco install mongodb

# Start MongoDB:
mongod
```

### Backend .env (Local)
```env
MONGODB_URI=mongodb://localhost:27017/medical-records
```

---

## Cloud File Storage Options

### Option A: Cloudinary (Recommended for Images/PDFs)

#### 1. Create Cloudinary Account
- Go to https://cloudinary.com/
- Sign up for free account
- Get your credentials from dashboard

#### 2. Install Cloudinary SDK
```bash
cd backend
npm install cloudinary
```

#### 3. Add to backend/.env
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STORAGE_TYPE=cloudinary
```

#### 4. Update Configuration
I'll create the cloudinary config file for you.

---

### Option B: AWS S3

#### 1. Create AWS Account
- Go to https://aws.amazon.com/
- Create an S3 bucket
- Get your credentials

#### 2. Install AWS SDK
```bash
cd backend
npm install @aws-sdk/client-s3
```

#### 3. Add to backend/.env
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
STORAGE_TYPE=s3
```

---

### Option C: Local Storage (Default - Already Configured)

Files are stored in `backend/uploads/` directory.

**Backend .env:**
```env
STORAGE_TYPE=local
```

---

## Quick Setup Recommendations

### For Development:
- **MongoDB**: Local MongoDB
- **File Storage**: Local storage
- **Pros**: No external dependencies, faster development
- **Cons**: Data on local machine only

### For Production:
- **MongoDB**: MongoDB Atlas
- **File Storage**: Cloudinary or AWS S3
- **Pros**: Scalable, backed up, accessible anywhere
- **Cons**: Requires internet, potential costs

---

## Next Steps

**Tell me which option you prefer:**

1. **MongoDB**: Atlas (cloud) or Local?
2. **File Storage**: Cloudinary, AWS S3, or Local?

I'll then:
1. Set up the configuration files
2. Update the backend code to support your choice
3. Provide step-by-step instructions
