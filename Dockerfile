FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV SERVER_PORT=3030

EXPOSE 3030

CMD ["npm", "start"]