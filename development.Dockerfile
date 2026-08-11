FROM node:26.7.0

# Set app directory
WORKDIR /app

RUN npm i -g corepack && corepack enable

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./
COPY app/.yarn ./.yarn

RUN yarn install

EXPOSE 4200

CMD ["yarn", "start", "--host", "0.0.0.0", "--poll", "2000"]
