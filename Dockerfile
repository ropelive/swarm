FROM mhart/alpine-node:base-8

WORKDIR .
ADD . .

CMD ["node", "swarm.js"]
