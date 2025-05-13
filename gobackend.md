# Go Microservice for Realtime Chat

This is a Go microservice that handles chat functionality for the realtime-chat application. It works alongside the Express.js backend in a microservices architecture.

## Setup

1. Make sure Go is installed on your system (version 1.16+ recommended)
2. Install dependencies:
   ```
   go mod tidy
   ```
3. Set up your environment variables by copying the `.env.example` file:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your MongoDB connection string and other variables.

## Running the service

Development mode:
```
go run main.go
```

Build and run:
```
go build -o chat-service
./chat-service
```

## API Endpoints

- **GET /api/chat/token**: Get a token for chat authentication
  - Requires authentication (JWT token in Authorization header)

- **POST /api/chat/messages**: Save a new chat message
  - Requires authentication (JWT token in Authorization header)
  - Body: 
    ```json
    {
      "content": "Hello, world!",
      "roomId": "room-id"
    }
    ```

## Integration with Frontend

The frontend can communicate with this service directly at `http://localhost:5002` for chat-related functionality, while still using the Express backend at `http://localhost:5001` for other features.

## Architecture

This microservice follows a standard Go application structure:
- `config/`: Database and other configuration
- `controllers/`: Request handlers
- `middleware/`: Authentication and other middleware
- `models/`: Data models
- `routes/`: API routes

The service maintains its own connection to MongoDB but shares the same database as the Express backend. 