#!/bin/bash
CPUARCH=$(uname -m)
NETWORK=nats-cluster-network
MASTERIP=192.168.10.249
SERVICENAME=nats-cluster-node
echo $CPUARCH

docker build -t pietersynthesis/nats-drone-$CPUARCH .
docker push pietersynthesis/nats-drone-$CPUARCH

docker swarm leave -f
docker swarm init --advertise-addr $MASTERIP

while true; do
    read -p "Have you added other Docker Swarm nodes?" yn
    case $yn in
    [Yy]*)
        echo "continuing..."
        break
        ;;
    [Nn]*) echo 'Add docker swarm nodes using the command above...' ;;
    *) echo "Please answer yes or no." ;;
    esac
done

for i in $(seq 1 3); do
    echo "Removing NATS service #$i if exists" 
    docker service rm $SERVICENAME-$i
done
echo "Removing Network if exists" 
docker network rm $NETWORK
echo "Creating network" 
docker network create --driver overlay --attachable $NETWORK

for i in $(seq 1 3); do
    echo "Creating NATS service #$i"
    docker service create --network $NETWORK \
        --name $SERVICENAME-$i nats:1.1.0 \
        -cluster nats://0.0.0.0:6222 \
        -routes nats://nats-cluster-node-1:6222,nats://nats-cluster-node-2:6222,nats://nats-cluster-node-3:6222
done

terminator &

for i in $(seq 1 6); do
    echo "Removing nats-client-$i if exists" 
    docker rm -f nats-client-$i
    echo "Spawning shell to nats-client-$i"
    x-terminal-emulator -e docker run --network $NETWORK --name nats-client-$i -it pietersynthesis/nats-drone-$CPUARCH ash &
done

