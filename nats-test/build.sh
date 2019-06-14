#!/bin/bash
docker build -t pietersynthesis/nats-drone-sim:base -f Dockerfile.base .

files=()
while IFS= read -r line; do
    files+=( "$line" )
done < <( find *.js | grep -Ev 'util.js|nats-conf.js' | sed 's/.js//' )

# files=$(find *.js | grep -v "util.js" | sed 's/.js//')

for js in "${files[@]}"
do
    docker build --build-arg FILENAME=$js.js -t pietersynthesis/nats-drone-sim:$js -f Dockerfile.operator .
done

docker stack deploy --compose-file docker-compose.yaml nats-swarm