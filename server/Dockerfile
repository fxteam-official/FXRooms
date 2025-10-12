FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@latest-10

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 8080
EXPOSE 9000

CMD [ "pnpm", "run", "start" ]