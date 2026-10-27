FROM node:22-bullseye-slim

WORKDIR /app

# Use the project's committed pnpm lockfile, not a nonexistent yarn.lock.
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
