FROM node:20

WORKDIR /app
COPY package.json bun.lock ./
RUN npm install -g bun
RUN bun install

COPY . .
RUN bunx prisma generate

EXPOSE 3003

CMD ["bun", "run", "index.ts"]
