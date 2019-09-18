#!/bin/bash

ARCH=$(uname -m)
docker build -t pietersynthesis/nats-bench:$ARCH .

docker run --rm -it --network host --name nats-bench --mount src="$(pwd)/results",target=/opt/results,type=bind pietersynthesis/nats-bench:$ARCH bash