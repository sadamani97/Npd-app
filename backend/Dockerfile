FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Force rename Controllers to lowercase to handle Windows host filesystem casing issues
RUN mv Controllers controllers || true

EXPOSE 5001

CMD ["npm", "start"]
