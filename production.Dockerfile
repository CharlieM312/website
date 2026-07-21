FROM node:26 AS build

WORKDIR /app/app

RUN npm i -g corepack && corepack enable
RUN corepack prepare yarn@4.17.1 --activate

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./
COPY app/.yarn ./.yarn
RUN yarn install --immutable

COPY app/ ./
RUN yarn production

FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/app/dist/charlie-website/browser/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]