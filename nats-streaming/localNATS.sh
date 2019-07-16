#!/bin/bash
echo "Removing any existing NATS server"
docker rm nats-main -f
echo "Starting new NATS server"
docker run -d --name=nats-main -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
CLUSTER_ID=$(cat .env | grep CLUSTER_ID= | cut -d '=' -f2)
echo "Starting NATS Streams server: $CLUSTER_ID"
docker run -ti --link nats-main nats-streaming -cid $CLUSTER_ID -ns nats://nats-main:4222

# docker run -ti -p 4222:4222 -p 8222:8222 nats-streaming