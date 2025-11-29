# ====== STAGE 1: Build the Angular app ======
FROM node:20.19.0-alpine AS build

# Create app directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY angular.json tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project (including src/)
COPY . .

# Build the Angular app with production configuration
RUN npm run build -- --configuration production

# ====== STAGE 2: Serve with Nginx ======
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Install openssl and create SSL directory
RUN apk add --no-cache openssl && mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Copy built Angular app from previous stage
# Angular 21 puts files in the browser/ subdirectory
COPY --from=build /app/dist/camera-app/browser /usr/share/nginx/html

# Use your custom nginx config (good for Angular routing)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
