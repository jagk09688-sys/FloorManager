// PM2 process config — runs backend + frontend on Windows startup
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (follow the printed command to register auto-start)

module.exports = {
  apps: [
    {
      name: "fm-backend",
      cwd: "./Backened",
      script: "server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        APP_PORT: "5001",
      },
      // Restart on crash, wait 3 s before restart
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
    {
      name: "fm-frontend",
      cwd: "./frontend",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "http://localhost:5001/api",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
