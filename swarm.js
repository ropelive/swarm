const RopeNode = require('@rope/node').Rope
const cities = require('all-the-cities')

const NAME = process.env.NAME || 'swarm'
const NODES = process.env.NODES || 10
const CALLWAIT = process.env.CALLWAIT || 5000 // in ms
const MAX_REPEAT = process.env.MAX_REPEAT || 3
const ROPE_DEBUG = process.env.ROPE_DEBUG || 0
const ROPE_SERVER = process.env.ROPE_SERVER || 'http://0.0.0.0:3210'

const Nodes = {}

function rnd(max = NODES) {
  return Math.floor(Math.random() * max)
}

class SwarmNode extends RopeNode {
  constructor(i) {
    const region = cities[rnd(cities.length)]

    super(
      `${NAME}-${i}`,
      {
        'swarm.talk': {
          args: 'String, Function',
          docs: 'echo function for nodes to talk each other',
          func: (message, cb) => {
            cb(null, message)
          },
        },
      },
      {
        region,
        url: ROPE_SERVER,
        logLevel: ROPE_DEBUG,
      }
    )

    this.lifetime = 0

    setTimeout(() => {
      console.log(`[${NAME}-${i}] Ready to go from ${region.name}`)
      setInterval(() => {
        this.lifetime++
        console.log(`[${NAME}-${i}] On cycle ${this.lifetime}/${MAX_REPEAT}`)
        if (this.lifetime >= MAX_REPEAT) {
          this.lifetime = 0
          console.log(`[${NAME}-${i}] Died.`)
          this.disconnect()
          setTimeout(_ => {
            this.connect()
          }, rnd(3) * 2000)
        } else {
          this.ready(_ => {
            this.tell('run', {
              method: 'swarm.talk',
              args: 'Hi there!',
            })
          })
        }
      }, CALLWAIT)
    }, rnd() * 1000)
  }
}

for (var i = NODES - 1; i >= 0; i--) {
  Nodes[i] = new SwarmNode(i)
}
