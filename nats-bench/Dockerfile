FROM golang:1.13.0-buster

WORKDIR /opt

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get update
RUN apt-get install -y apt-utils
RUN apt-get install -y --no-install-recommends \
        apt-transport-https \
        build-essential \
        ca-certificates \
        software-properties-common \
        curl \
        git \
        libssl-dev \
        wget

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install nodejs -y

COPY . .

RUN npm install

RUN go get github.com/nats-io/nats.go/
RUN go get github.com/nats-io/nats.go/bench
RUN go build bench.go
