#!/usr/bin/env node
const net = require('net')
const { spawn } = require('child_process')

const desired = parseInt(process.env.PORT || process.argv[2] || '3000', 10)
const maxAttempts = 100

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false
    socket.setTimeout(1000)

    socket.once('connect', () => {
      resolved = true
      socket.destroy()
      resolve(false) // port in use
    })

    socket.once('timeout', () => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve(true) // no service responded -> free
      }
    })

    socket.once('error', (err) => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        if (err.code === 'ECONNREFUSED') resolve(true)
        else resolve(false)
      }
    })

    socket.connect(port, '127.0.0.1')
  })
}

;(async () => {
  let port = desired
  for (let i = 0; i < maxAttempts; i++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkPort(port)
    if (ok) break
    port++
  }

  console.log(`[dev-auto] Starting Next.js dev on port ${port}`)
  // If Next's dev lock exists in this project, avoid starting a second instance
  const fs = require('fs')
  const path = require('path')
  const lockPath = path.resolve(process.cwd(), '.next', 'dev', 'lock')
  if (fs.existsSync(lockPath) && !process.env.FORCE_NEXT_DEV) {
    console.log('[dev-auto] Detected existing Next.js dev instance (lock file present).')
    console.log(`[dev-auto] To force start another instance, set env FORCE_NEXT_DEV=1 (not recommended).`)
    process.exit(0)
  }

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const command = `${npxCmd} next dev -p ${port}`
  const child = spawn(command, {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
    shell: true,
  })

  child.on('exit', (code) => process.exit(code))
})()
