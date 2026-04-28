FROM node:20-slim

# Install Chrome and Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && apt-get clean

# Install Puppeteer globally (bypasses package.json)
RUN npm install -g puppeteer

WORKDIR /app

# Copy only the script
COPY screenshot.js .

# Set Puppeteer to use system Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "screenshot.js"]
