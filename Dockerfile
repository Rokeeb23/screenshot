FROM node:20-slim

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    fonts-liberation \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Refresh font cache
RUN fc-cache -fv

WORKDIR /app

COPY package.json .

# Add a timestamp to bust cache
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST" && npm install && ls -la node_modules | head -20

COPY screenshot.js .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV LANG=C.UTF-8

CMD ["node", "screenshot.js"]
