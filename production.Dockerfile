FROM --platform=$BUILDPLATFORM node:26.11.1-alpine AS build

WORKDIR /app

RUN npm i -g npm@12.2.0 corepack && corepack enable

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./
COPY app/.yarn ./.yarn
RUN --mount=type=cache,target=/app/.yarn/cache \
    yarn install --immutable

COPY app/ ./
RUN --mount=type=secret,id=CARTO_API_KEY \
    --mount=type=cache,target=/app/.angular/cache \
    sh -c 'export CARTO_API_KEY="$(cat /run/secrets/CARTO_API_KEY)" && yarn production'

FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/charlie-website/browser/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]