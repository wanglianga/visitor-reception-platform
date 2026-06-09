FROM node:20-alpine AS backend-build

RUN apk add --no-cache python3 make g++

WORKDIR /build/backend

COPY backend/package*.json ./

RUN npm ci

COPY backend/ .

RUN npm run build

FROM node:20-alpine AS frontend-build

WORKDIR /build/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY --from=backend-build /build/backend/package*.json ./

RUN npm ci --omit=dev

COPY --from=backend-build /build/backend/dist ./dist

COPY --from=frontend-build /build/frontend/dist ./public

EXPOSE 3001

CMD ["node", "dist/main.js"]
