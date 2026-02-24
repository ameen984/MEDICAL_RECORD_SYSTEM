# Medical Record System - Backend & Frontend Setup Guide

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Running locally or cloud instance
- **npm** or **yarn**

---

## Quick Start Guide

### 1. Install MongoDB

**Windows:**
```bash
# Download from: https://www.mongodb.com/try/download/community
# Or use Chocolatey:
choco install mongodb
```

**Start MongoDB:**
```bash
mongod
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Dependencies are already installed
# If you need to reinstall:
npm install

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

The backend will start on: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The frontend will start on: **http://localhost:5174**

---

## Test Credentials

After seeding the database, use these credentials to log in:

### Admin Account
- **Email:** admin@medicare.com
- **Password:** admin123

### Doctor Accounts
- **Email:** john@medicare.com
- **Password:** doctor123

- **Email:** sarah@medicare.com
- **Password:** doctor123

### Patient Accounts
- **Email:** michael@example.com
- **Password:** patient123

- **Email:** emily@example.com
- **Password:** patient123

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

### Patients
- `GET /api/patients` - List all patients (doctors/admin)
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/history` - Get medical history
- `PUT /api/patients/:id` - Update patient info

### Medical Records
- `GET /api/records` - List records (filtered by role)
- `GET /api/records/:id` - Get single record
- `POST /api/records` - Create record (doctors only)
- `PUT /api/records/:id` - Update record (doctors only)
- `DELETE /api/records/:id` - Delete record (doctors/admin)

### Reports
- `GET /api/reports` - List reports (filtered by role)
- `POST /api/reports/upload` - Upload file (doctors only)
- `GET /api/reports/:id/download` - Download file
- `DELETE /api/reports/:id` - Delete report (doctors/admin)

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medical-records
JWT_SECRET=dev-secret-key-12345
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:5174
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
medical-record-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Entry point
│   ├── uploads/             # Uploaded files
│   ├── .env                 # Environment variables
│   └── package.json
│
└── src/                     # Frontend source code
    ├── app/                 # Redux store & API slice
    ├── components/          # Reusable components
    ├── features/            # Feature modules
    │   ├── admin/          # Admin module
    │   ├── doctor/         # Doctor module
    │   ├── patient/        # Patient module
    │   └── auth/           # Authentication
    └── router/              # React Router setup
```

---

## Development Workflow

1. **Start MongoDB** (in separate terminal)
   ```bash
   mongod
   ```

2. **Start Backend** (in separate terminal)
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (in separate terminal)
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

---

## Testing the Application

### 1. Admin Features
- Login as admin
- Create new doctors/patients
- View all users
- Change user roles
- Delete users

### 2. Doctor Features
- Login as doctor
- View patient list
- View patient medical history
- Create medical records
- Upload medical reports (PDF, JPG, PNG)

### 3. Patient Features
- Login as patient
- View own medical records
- View own reports
- Update profile information
- Manage emergency contacts

---

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
npm run build
# Serve the dist/ folder with a static server
```

---

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check connection string in backend/.env
- Verify firewall settings

### Cannot Find Module
```bash
# Backend
cd backend
npm install

# Frontend
npm install
```

### Port Already in Use
- Backend: Change PORT in backend/.env
- Frontend: Vite will auto-increment to 5175, 5176, etc.

### CORS Errors
- Ensure FRONTEND_URL in backend/.env matches your frontend URL
- Check browser console for exact error

---

## Security Notes

> [!CAUTION]
> **For Production:**
> - Change JWT_SECRET to a strong, random secret
> - Use environment-specific .env files
> - Enable HTTPS/SSL
> - Implement rate limiting (already included)
> - Use secure cookie storage for tokens
> - Set up proper CORS whitelist
> - Regular security audits

---

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in terminal
3. Check MongoDB logs
4. Verify all environment variables are set correctly
