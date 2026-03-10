# Deployment Guide: Medical Record System

The Medical Record System is a MERN stack application (MongoDB, Express, React/Vite, Node.js). Follow this guide to deploy your project to production.

## Prerequisites
1. **MongoDB Atlas Account**: You need a cloud MongoDB database.
2. **Render or Railway Account**: Good, free-tier-friendly platforms for hosting Node.js backends.
3. **Vercel or Netlify Account**: excellent for hosting React/Vite frontends.

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account.
2. Build a new Cluster (the free shared tier is fine).
3. Under **Database Access**, create a user with a username and password.
4. Under **Network Access**, add the IP `0.0.0.0/0` (allows access from anywhere since your backend server IP might change).
5. Click **Connect**, choose "Connect your application", and copy the connection string. Replace `<password>` with the password you set.

---

## Step 2: Deploy the Backend (Render)
Make sure your project is pushed to a GitHub repository.

1. Create an account on [Render](https://render.com/).
2. Click **New** -> **Web Service** -> **Build and deploy from a Git repository**.
3. Connect your GitHub and select the repository containing this project.
4. **Settings:**
    *   **Root Directory:** `backend` (Important: tell Render the backend lives in this folder)
    *   **Environment:** Node
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm run start`
5. **Environment Variables:** Add the following keys:
    *   `PORT`: `5000`
    *   `MONGO_URI`: `[Your MongoDB Atlas connection string from Step 1]`
    *   `JWT_SECRET`: `[A long random secret string of your choice]`
    *   `FRONTEND_URL`: `[Leave empty for now, update after Step 3]`
    *   *Add any other cloud storage keys if you are using AWS S3 for patient uploads.*
6. Click **Create Web Service**. Wait for it to build. Once deployed, copy the backend URL (e.g., `https://medical-record-backend.onrender.com`).

---

## Step 3: Deploy the Frontend (Vercel)
Vercel is highly optimized for Vite and React apps.

1. Create an account on [Vercel](https://vercel.com/) and connect your GitHub.
2. Click **Add New** -> **Project**.
3. Import the same repository.
4. **Settings:**
    *   **Framework Preset:** Vite
    *   **Root Directory:** `frontend` (Important: tell Vercel the frontend lives here)
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
5. **Environment Variables:** Add the backend URL you got from Render. Usually, in Vite apps, the variable might be named something like `VITE_API_URL`.
    *   *Note: Ensure your frontend API calls use `import.meta.env.VITE_API_URL` instead of hardcoded `http://localhost:5000`.*
6. Click **Deploy**.

---

## Step 4: Finalize Connections
1. Once the frontend is deployed on Vercel, copy the frontend URL (e.g., `https://medical-record-frontend.vercel.app`).
2. Go back to your **Render** backend settings.
3. Under Environment Variables, update the `FRONTEND_URL` to match your Vercel URL (this ensures CORS allows your frontend to talk to your backend).
4. Restart your Render server.

## Summary Checklist
- [ ] Database is in the Cloud (MongoDB Atlas)
- [ ] Backend is hosted and has `MONGO_URI`
- [ ] Frontend is hosted and point its API calls to the Hosted Backend URL
- [ ] Backend has CORS configured to accept requests from the Hosted Frontend URL
