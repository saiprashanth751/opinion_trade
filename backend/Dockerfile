FROM node:20

WORKDIR /app
COPY package.json bun.lock ./
RUN npm install -g bun
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "index.ts"]

