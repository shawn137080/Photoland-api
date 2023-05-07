FROM node:16.20

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
