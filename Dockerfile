FROM --platform=linux/amd64 node:16.13.2-alpine

RUN mkdir -p /app
COPY . /app
WORKDIR /app

ENV HOST "0.0.0.0"

EXPOSE 80
CMD [ "npm", "run", "prod"]
