FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY modules ./modules
COPY scripts ./scripts

ENV PORT=3000
EXPOSE 3000

USER node

CMD ["npm", "start"]
