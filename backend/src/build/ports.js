import net from 'node:net'

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer()
    probe.once('error', () => resolve(false))
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)))
  })
}

export async function findFreePort(start, end = start + 400) {
  let port = start
  while (port <= end) {
    if (await isPortFree(port)) return port
    port += 1
  }
  throw new Error(`No free preview port found between ${start} and ${end}`)
}