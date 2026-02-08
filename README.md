# MERN Stack Project

This is a basic MERN stack project structure for the Forgetti-List application.

## Structure

- `client/`: React frontend (Vite)
- `server/`: Express backend

## Getting Started

### Prerequisites

- Node.js installed

### Quick Start (Run Both)

From the root directory:
1. Install dependencies (Root, Server, and Client):
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. Start both servers:
   ```bash
   npm start
   ```
   This will run the server on port 5000 and the client on port 5173.

### Manual Setup

1.  **Server Setup**:
    Open a terminal and navigate to the server directory:
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add your variables (e.g., `PORT=5000`, `MONGO_URI=...`).
    Start the server:
    ```bash
    npm run dev
    ```

2.  **Client Setup**:
    Open a new terminal and navigate to the client directory:
    ```bash
    cd client
    npm install
    ```
    Start the client:
    ```bash
    npm run dev
    ```
