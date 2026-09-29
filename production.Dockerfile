FROM node:26.10.0 AS build

WORKDIR /app/app

RUN npm i -g corepack && corepack enable

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./
COPY app/.yarn ./.yarn
RUN yarn install --immutable

COPY app/ ./
RUN --mount=type=secret,id=CARTO_API_KEY \
    sh -c 'export CARTO_API_KEY="$(cat /run/secrets/CARTO_API_KEY)" && yarn production'

FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/app/dist/charlie-website/browser/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]