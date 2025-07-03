# frontend/Dockerfile
# Use a Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json) to leverage Docker cache
COPY package*.json ./

# Install dependencies
# Using npm install as it's common, but you can switch to yarn if preferred
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the React app will run on
EXPOSE 3000

# Command to start the development server
# For Vite, this is typically 'npm run dev'
CMD ["npm", "run", "dev"]
