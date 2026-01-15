Step 2 — Enable & start the service
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

Step 3 — Verify it’s running
sudo systemctl status cloudflared


You should see active (running)

The same URL (https://...trycloudflare.com) will now stay live all the time

Step 4 — Stop or restart it easily
sudo systemctl stop cloudflared      # Stop tunnel
sudo systemctl start cloudflared     # Start tunnel
sudo systemctl restart cloudflared   # Restart tunnel