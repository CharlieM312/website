FROM node:22

# Set app directory
WORKDIR /app

COPY app/package*.json ./
RUN npm install -g @angular/cli && npm install

COPY app/ .

EXPOSE 4200

CMD sh -c "test -f /app/angular.json && ng serve --host 0.0.0.0 --poll 2000 || echo 'Not an Angular workspace'"
