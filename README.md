# Realtime-chat-app

<div align="center">Connect and chat in real-time, with a modern and responsive interface.</div>

<div align="center">
  
[![last commit](https://img.shields.io/badge/last%20commit-May%202025-blue)](https://github.com/yourusername/Realtime-chat-app)
[![languages](https://img.shields.io/badge/languages-2-blue)](https://github.com/yourusername/Realtime-chat-app)

</div>

<div align="center">Built with the tools and technologies:</div>

<div align="center">
  
<!-- These technologies are confirmed to be used in the codebase -->
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

</div>

<div align="center">
  
[![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

<div align="center">
  
[![Stream](https://img.shields.io/badge/Stream-005FF9?style=for-the-badge&logo=stream&logoColor=white)](https://getstream.io/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)](https://github.com/motdotla/dotenv)

</div>

## Screenshots

![Home Page](./image/homepage.png?v=2)
*Home Interface*

![Sign Up](./image/createaccountpage.png?v=2)
*Signup Interface*

![Sign In](./image/loginpage.png?v=2)
*Signin Interface*

![Complete Profile](./image/completeprofilepage.png?v=2)
*Complete Profile Interface*

![Chat Interface](./image/chatpage.png?v=2)
*Realtime Chat Interface*

![Notifications](./image/notificationspage.png?v=2)
*Notifications Interface*

![Call Interface](./image/callapp.png?v=2)
*App Call Interface*

## Objective
This project aims to create a real-time chat application with the following goals:
1. Enable instant messaging between users
2. Support private and group conversations
3. Provide secure user authentication
4. Deliver a responsive and intuitive UI
5. Allow message history and media sharing
6. Implement video calling capabilities

## Methodology
The system is built using a MERN architecture with React frontend and Node.js/Express backend:

### Backend Design
- **Express.js Backend**: Handles user authentication, profile management, friend requests, and chat operations
- **Authentication**: JWT-based authentication secures user access
- **Database**: MongoDB stores user data and message history
- **Real-time**: Stream Chat API enables instant message delivery and video calls
- **Validation**: Server-side validation ensures data integrity
- **Socket.IO**: Enables real-time notifications and friend management updates

### Frontend Design
- **Interface**: React with Tailwind CSS creates a responsive UI
- **State Management**: React Context API and React Query manage application state
- **Real-time**: Stream Chat client for real-time messaging
- **HTTP Requests**: Axios handles API communication with the backend

### Process
- User registers or logs in through the Express authentication system
- Express backend validates credentials and issues JWT tokens
- Users can create chats, send messages, and receive real-time updates
- Messages are stored in MongoDB for persistence
- Frontend updates in real-time when new messages arrive

## Tools
- **Backend**: 
  - **Node.js/Express**: Full API handling including user management, authentication, and chat
- **Database**: MongoDB, Mongoose
- **Frontend**: React, Tailwind CSS, Axios
- **Real-time Communication**: Stream Chat API, Socket.IO
- **Authentication**: JWT, bcrypt
- **Development**: Nodemon, Vite

## Features
1. Real-time messaging with typing indicators
2. User authentication and profile management
3. Private and group chat support
4. Message history persistence
5. Responsive design for mobile and desktop
6. Online status indicators
7. Read receipts
8. Media sharing capabilities
9. Video calling integration
10. Real-time friend request management with notifications

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Project Structure
```
realtime-chat/
├── frontend/            # React frontend
└── backend/             # Express.js backend for all functionality
    ├── src/             # Source code
      ├── controllers/   # Request handlers
      ├── middleware/    # Express middleware (auth, error handling)
      ├── models/        # Data models for MongoDB
      ├── routes/        # API route definitions
      ├── lib/           # Utility libraries
      └── server.js      # Express app setup and entry point
```

## API Endpoints

### Express Backend (port 5001)
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: User login
- `GET /api/users`: Get all users
- `GET /api/users/friends`: Get user's friends
- `POST /api/users/friend-request/:userId`: Send friend request
- `GET /api/chat/token`: Get Stream Chat token
- `POST /api/chat/messages`: Save chat messages

## Future Plans
1. Enhanced video calling features
2. End-to-end encryption
3. Push notifications
4. File sharing and cloud storage
5. Message search functionality

## License
MIT