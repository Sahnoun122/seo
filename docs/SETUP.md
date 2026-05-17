# Installation & Setup Guide

Follow these steps to get the AI SEO Article Generator running on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas)
- OpenAI API Key

## 1. Environment Configuration

1. Copy the `.env.example` file in the root directory to `.env`.
   \`\`\`bash
   cp .env.example .env
   \`\`\`
2. Open `.env` and fill in your details:
   - \`PORT\`: Typically \`5000\`.
   - \`MONGODB_URI\`: Your MongoDB connection string.
   - \`OPENAI_API_KEY\`: Your secret key from OpenAI.

## 2. Backend Setup

1. Navigate to the \`/backend\` directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install the required dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the backend server:
   \`\`\`bash
   npm run dev
   \`\`\`
   You should see a message indicating the server is running and connected to MongoDB.

## 3. Frontend Setup

1. Open a new terminal window and navigate to the \`/frontend\` directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. (Optional) Configure the frontend environment variable if your backend is running on a different port. Copy \`frontend/.env.example\` to \`frontend/.env\` and update \`VITE_API_URL\`.
3. Install the required dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Start the frontend development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser and navigate to the URL provided in the terminal (usually \`http://localhost:5173\`).

## Troubleshooting

- **MongoDB Connection Error**: Ensure your MongoDB instance is running, and the URI in the \`.env\` file is correct. If using Atlas, make sure your IP is whitelisted.
- **OpenAI API Error**: Ensure your API key is valid and has sufficient quota.
- **CORS Error**: If the frontend cannot communicate with the backend, verify that the \`VITE_API_URL\` matches the backend port and host exactly.
