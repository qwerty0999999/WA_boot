FROM node:20-alpine

# Install FFMPEG for sticker support
RUN apk add --no-cache ffmpeg

# Set work directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose port (for healthchecks)
EXPOSE 3000

# Start bot
CMD ["node", "index.js"]
