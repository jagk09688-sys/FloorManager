# FloorManager — Desktop Setup Guide

## What you need on each machine

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop/
   - Install it, restart the computer, make sure it shows "Docker Desktop is running" in the system tray
   - That is the ONLY thing to install — no Node.js, no PostgreSQL, nothing else

2. **The FloorManager folder** (copy the whole folder to the new machine via USB or network share)

---

## First-time setup on a new machine

1. Install Docker Desktop (see above)
2. Copy the `FM` folder to the Desktop (or anywhere)
3. Double-click **`rebuild.bat`**
   - This builds the app images and starts everything
   - First run takes ~5 minutes (downloads base images)
4. Open a browser and go to **http://localhost:3000**
5. Sign in with:
   - Email: `admin@flooringjunction.com.au`
   - Password: `Admin@1234`

---

## Every day after that

- **Start the app:** double-click `start.bat`
- **Stop the app:** double-click `stop.bat`
- **App URL:** http://localhost:3000

---

## Auto-start when Windows boots (optional)

Open Docker Desktop → Settings → General → tick **"Start Docker Desktop when you log in"**

Then Docker and all containers will start automatically on login.

To make the containers auto-start with Docker, open a terminal in the FM folder and run:

```
docker compose up -d
```

The `restart: unless-stopped` setting in docker-compose.yml means once the containers have been started, they will automatically restart whenever Docker starts.

---

## Sharing one database across multiple machines (network setup)

If you want all shop desktops to share the **same data**:

1. Pick **one** machine as the "server" (leave it running all day)
2. On that machine run `start.bat` as normal
3. On other machines, they need to point to the server's IP instead of localhost
   - Edit `docker-compose.yml` on the other machines
   - Change `NEXT_PUBLIC_API_URL: http://localhost:5001/api`
     to `NEXT_PUBLIC_API_URL: http://SERVER_IP:5001/api`
   - Change the frontend Dockerfile `ARG NEXT_PUBLIC_API_URL` line the same way
   - Run `rebuild.bat`
4. Make sure Windows Firewall on the server allows port 3000 and 5001

---

## Updating the app (after code changes)

1. Copy the updated FM folder to the machine (overwrite old files)
2. Double-click **`rebuild.bat`**
3. Your database data is preserved in a Docker volume — it is NOT deleted on rebuild

---

## Database backup

To export your database data run this in a terminal:

```
docker exec fm-db pg_dump -U postgres flooring_junction > backup.sql
```

To restore on a new machine:

```
docker exec -i fm-db psql -U postgres flooring_junction < backup.sql
```
