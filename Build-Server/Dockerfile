# FROM ubuntu:focal

# RUN apt-get update
# RUN apt-get install -y curl
# RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
# RUN apt-get upgrade -y
# RUN apt-get install -y nodejs

# RUN apt-get install -y git


# WORKDIR /home/shantanu/Project_Deplo

# RUN mkdir -p /home/shantanu/certs


# COPY main.sh main.sh
# COPY script.js script.js
# COPY package*.json .
# COPY kafka.pem /home/shantanu/certs/kafka.pem

# RUN npm install

# RUN chmod +x main.sh
# RUN chmod +x script.js

# ENTRYPOINT [ "/home/shantanu/Project_Deplo/main.sh" ]




FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /home/shantanu/Project_Deplo
RUN mkdir -p /home/shantanu/certs

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .
COPY kafka.pem /home/shantanu/certs/kafka.pem

RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.js

ENTRYPOINT [ "/home/shantanu/Project_Deplo/main.sh" ]
