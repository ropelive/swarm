const RopeNode = require('@rope/node').Rope
const cities = require('all-the-cities')

const NAME = process.env.NAME || 'swarm'
const NODES = process.env.NODES || 10
const CALLWAIT = process.env.CALLWAIT || 5000 // in ms
const MAX_REPEAT = process.env.MAX_REPEAT || 3
const ROPE_DEBUG = process.env.ROPE_DEBUG || 0
const ROPE_SERVER = process.env.ROPE_SERVER || 'http://0.0.0.0:3210'

const api = ['mod2', 'talk', 'greet', 'string', 'square', 'random', 'fail']
const types = ['firefox', 'safari', 'chrome', 'opera', 'edge', 'node.js', 'go']
const Nodes = {}

function rnd(max = NODES) {
  return Math.floor(Math.random() * max)
}
function getRandomRegion() {
  let region = cities[rnd(cities.length - 1)]
  return {
    city: region.name,
    country: region.country,
    ll: [region.lat, region.lon],
  }
}

class SwarmNode extends RopeNode {
  constructor(i) {
    const name = `${NAME}-${i}`

    let environment = types[rnd(types.length - 1)]
    let region = getRandomRegion()

    let title = `[${name} - ${environment}]`

    super(
      name,
      {
        'swarm.mod2': (i, cb) => cb(null, i % 2),
        'swarm.talk': (i, cb) => cb(null, i),
        'swarm.greet': (i, cb) => cb(null, `Hi ${i}`),
        'swarm.string': (i, cb) => cb(null, `${i}`),
        'swarm.square': (i, cb) => cb(null, i ** i),
        'swarm.random': (i = 100, cb) => cb(null, rnd(i)),
        'swarm.fail': (i, cb) => cb({ message: 'failed :(' }),
      },
      {
        region,
        environment,
        url: ROPE_SERVER,
        logLevel: ROPE_DEBUG,
      }
    )

    this.lifetime = 0
    let method, args

    setTimeout(() => {
      console.log(`${title} Started from ${region.city} / ${region.country}`)

      setInterval(() => {
        this.lifetime++
        console.log(`${title} On cycle ${this.lifetime}/${MAX_REPEAT}`)

        if (this.lifetime >= MAX_REPEAT) {
          this.lifetime = 0
          console.log(`${title} Died.`)
          this.options.region = region = getRandomRegion()
          this.disconnect()
          setTimeout(_ => {
            console.log(
              `${title} Started from ${region.city} / ${region.country}`
            )
            this.connect()
          }, rnd(3) * 2000)
        } else {
          this.ready(_ => {
            method = `swarm.${api[rnd(api.length - 1)]}`
            args = rnd(10)

            console.log(`${title} Calling ${method} with ${args}`)

            this.tell('run', { method, args })
              .then(res =>
                console.log(`${title} Got response for ${method}: ${res}`)
              )
              .catch(res =>
                console.log(`${title} Call failed for ${method}: ${res}`)
              )
          })
        }
      }, CALLWAIT)
    }, rnd() * 1000)
  }
}

for (var i = NODES - 1; i >= 0; i--) {
  Nodes[i] = new SwarmNode(i)
}
