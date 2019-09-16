#!/bin/bash

ARCH=$(uname -m)
NETWORK=nats-streaming-network

docker build -t pietersynthesis/nats-bench:$ARCH .
docker push pietersynthesis/nats-bench:$ARCH

for i in `seq 1 3`; do
  docker service rm nats-cluster-node-$i
  docker service rm nats-streaming-node-$i
done

docker network rm $NETWORK
docker network create --driver overlay --attachable $NETWORK

for i in `seq 1 3`; do
docker service create --publish $i4222:4222 \
                      --network $NETWORK \
                      --name nats-cluster-node-$i nats:1.1.0 \
                      -cluster nats://0.0.0.0:6222 \
                      -routes nats://nats-cluster-node-1:6222,nats://nats-cluster-node-2:6222,nats://nats-cluster-node-3:6222
done

for i in `seq 1 3`; do
docker service create --publish 6222:6222 \
                      --network $NETWORK \
                      --name nats-streaming-node-$i nats-streaming:0.9.2 \
                      -store file -dir store -clustered -cluster_id swarm -cluster_node_id node-$i \
                      -cluster_peers node-1,node-2,node-3 \
                      -nats_server nats://nats-cluster-node-1:4222,nats://nats-cluster-node-2:4222,nats://nats-cluster-node-3:4222
done
