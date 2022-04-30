FROM node:alpine

WORKDIR /Auth1


ADD /models /Auth1/models
COPY package.json /Auth1/package.json
RUN npm install

COPY . .

ENTRYPOINT [ "npm","start" ];

EXPOSE 3001