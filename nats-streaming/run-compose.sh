#!/bin/bash

docker build -t pietersynthesis/nats-swarm-positionupdate:x86 -f Dockerfile.positionUpdate .
docker build -t pietersynthesis/nats-swarm-distancecalculator:x86 -f Dockerfile.distanceCalculator .
docker build -t pietersynthesis/nats-swarm-distancetrigger:x86 -f Dockerfile.distanceTrigger .
docker build -t pietersynthesis/nats-swarm-deadnodedetector:x86 -f Dockerfile.deadNodeDetector .

docker push pietersynthesis/nats-swarm-positionupdate:x86
docker push pietersynthesis/nats-swarm-distancecalculator:x86
docker push pietersynthesis/nats-swarm-distancetrigger:x86
docker push pietersynthesis/nats-swarm-deadnodedetector:x86

docker-compose down
docker-compose up