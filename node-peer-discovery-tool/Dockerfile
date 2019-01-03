FROM arm32v7/debian

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN apt update
# Install Node.js
RUN apt-get install --yes apt-utils
RUN apt-get install --yes curl sudo apt-transport-https lsb-release gnupg build-essential g++
RUN curl --silent --location https://deb.nodesource.com/setup_8.x | sudo bash -
RUN apt-get install --yes nodejs

RUN npm install

EXPOSE 9090

CMD ["bash"]