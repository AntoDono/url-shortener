# URL Shortener

A full-stack web application for shortening url created with Refine

⭐ Live Site: [url.antodono.com](https://url.antodono.com/links)

## Overview

This URL shortener application allows users to create custom short URLs for long links. The system tracks usage statistics for each shortened link and provides a simple dashboard to manage all your links in one place.

## Tech Stack

### Frontend
- React with TypeScript
- [Refine](https://refine.dev/) framework
- Ant Design component library
- React Router for navigation

### Backend
- Node.js with Express
- Supabase for database storage
- Authentication with session management
- Password encryption for security

## Project Structure

```
url-shortener/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── links/           # Link management components
│   │   ├── providers/       # Auth providers and API connections
│   │   └── App.tsx          # Main application component
│   └── ...
└── backend/                 # Node.js backend API
    ├── index.js             # Express server and API endpoints
    └── ...
```

## Prerequisites

- Node.js ^16.0.0
- Supabase account (for database)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PORT=3001
   DECODE_KEY=your_secret_key_for_password_encryption
   GMAIL=your_gmail
   GOOGLE_APP_PASSWORD=your_gmail_app_password
   FRONTEND_URL=the_frontend_url
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory with:
   ```
   VITE_API_URL=http://localhost:3001
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:5173`

## Database Structure

The application uses Supabase with the following tables:

**users**
- id (primary key)
- email (unique)
- password (encrypted)
- created_at

**links**
- id (primary key)
- user_id (foreign key to users)
- alias (unique)
- url
- accessed (click counter)
- created_at

## Usage

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Create Shortened URL**:
   - Enter the original long URL
   - Choose a custom alias (or use the auto-generated one)
   - Click "Create Link"
3. **Manage Links**:
   - View all your links in the dashboard
   - Edit or delete links as needed
   - Track usage statistics
4. **Share Your Link**: Copy the shortened URL and share it anywhere

## Deployment

### Backend Deployment
- Can be deployed to any Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
- Ensure environment variables are properly set in your hosting environment

### Frontend Deployment
- Build the production version: `npm run build`
- Deploy the contents of the `dist` folder to any static site hosting (Netlify, Vercel, GitHub Pages, etc.)
- Configure environment variables for the production API URL

## License

MIT
