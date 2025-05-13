# Go to Express Backend Migration

This project has been migrated from a dual backend architecture (Express + Go) to a single Express backend for simplicity and easier deployment.

## Changes Made

1. Removed the Go backend completely
2. Migrated the following functionality to Express:
   - Chat token generation
   - Message saving
   - Debug endpoint for auth

3. Updated frontend to use Express backend for all API calls
4. Created a proper Message model in Express for MongoDB integration

## Environment Variables

All environment variables remain the same and have been consolidated in the Express backend `.env` file:

```
PORT=5001
MONGO_URI=mongodb+srv://...
STEAM_API_KEY=...
STEAM_API_SECRET=...
JWT_SECRET_KEY=...
```

## Deployment

The application can now be deployed as a single Express backend with React frontend, which simplifies deployment to platforms like Render.

To deploy:

1. Push the codebase to your repository
2. Connect to Render or your preferred hosting platform
3. Set up a Web Service pointing to the backend directory
4. Set the build command to:
   ```
   cd ../frontend && npm install && npm run build && cd ../backend && npm install
   ```
5. Set the start command to:
   ```
   cd backend && npm start
   ```
6. Set environment variables on Render matching your .env file
7. Deploy and enjoy the simplified architecture!

## Notes for Development

During development, you'll still run the frontend and backend separately:

1. Start the Express backend:
   ```
   cd backend
   npm run dev
   ```

2. Start the React frontend:
   ```
   cd frontend
   npm run dev
   ```

The backend will run on port 5001 and the frontend on port 5173. 