FROM node:26

# Set app directory
WORKDIR /app

RUN npm i -g corepack && corepack enable
RUN corepack prepare yarn@4.17.1 --activate

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./
COPY app/.yarn ./.yarn

RUN yarn install

EXPOSE 4200

CMD ["yarn", "start", "--host", "0.0.0.0", "--poll", "2000"]
