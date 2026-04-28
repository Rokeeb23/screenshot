FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && apt-get clean

WORKDIR /app

# Create package.json first
RUN echo '{"name":"screenshot","version":"1.0.0","dependencies":{"puppeteer":"22.0.0"}}' > package.json

# Install dependencies
RUN npm install

# Copy your script
COPY screenshot.js .

# Tell puppeteer where Chrome is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "screenshot.js"]
