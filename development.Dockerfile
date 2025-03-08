FROM node:22

# Set app directory
WORKDIR /app

COPY app/package*.json ./
RUN npm install -g @angular/cli && npm install

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--poll 2000"]
