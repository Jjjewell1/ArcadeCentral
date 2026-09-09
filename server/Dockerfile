FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
