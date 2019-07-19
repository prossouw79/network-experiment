#!/bin/bash
echo "Removing any existing NATS server"
docker rm nats-main -f
echo "Starting new NATS server"
docker run -d --name=nats-main -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
CLUSTER_ID=$(cat .env | grep CLUSTER_ID= | cut -d '=' -f2)
echo "Starting NATS Streams server: $CLUSTER_ID"
docker run -ti --link nats-main nats-streaming \
         --cluster_id $CLUSTER_ID \
         --store file \
         --dir ./data \
         --nats_server nats://nats-main:4222 \
         --cluster_log_cache_size 67108864 \
         --max_channels 16 \
         --max_bytes 268435456 \
         --max_msgs 0 \
         --max_subs 16 \
         --max_inactivity 300s \
         --max_age 600s \

# docker run -ti -p 4222:4222 -p 8222:8222 nats-streaming