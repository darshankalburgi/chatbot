# 🌎 Deployment Guide

This guide will help you deploy the Chatbot Platform to the web using **Render** (for the backend) and **Vercel** (for the frontend).

## 1. Prerequisites
- A **GitHub** account with your code pushed to a repository.
- A **MongoDB Atlas** cluster (already created).
- An **OpenRouter** API Key.

---

## 2. Backend Deployment (Render)

1. **Log in** to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. **Configure the Service**:
   - **Name**: `chatbot-backend` (or similar)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**: Click "Advanced" or "Environment" and add:
   - `NODE_OPTIONS`: `--max-old-space-size=450` (Helps stay within Render's free tier limit)
   - `PORT`: `10000` (Render's default)

   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A long random string (e.g., `super_secret_123`).
   - `OPENROUTER_API_KEY`: Your OpenRouter key.
6. Click **Create Web Service**. 
7. Once deployed, **copy the URL** (e.g., `https://chatbot-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. **Log in** to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
5. **Environment Variables**: Expand the section and add:
   - `VITE_API_URL`: Paste your Backend URL and add `/api` at the end (e.g., `https://chatbot-backend.onrender.com/api`).
6. Click **Deploy**.

> [!TIP]
> **Fixing 404 on Refresh**: I have added a `vercel.json` file in the `client` folder. This automatically tells Vercel to handle React routing so you don't get 404 errors when refreshing the page.

---


## 4. Post-Deployment Check
- Visit your Vercel URL.
- Try registering a new user.
- Upload a PDF and ensure the chat works!

---

## 🛠️ Troubleshooting
- **CORS Errors**: If you get CORS errors, go to `server/index.ts` and ensure `origin: '*'` is set (which it is by default in this project).
- **Environment Variables**: Ensure `VITE_API_URL` starts with `https://` and includes the `/api` suffix.
