# ClipForge Deployment Guide

## Local Development

### Quick Start
```bash
npm install
npm run dev        # Frontend (1111)
npm run server:dev # Backend (3000)
```

## Docker Deployment

### Build Image
```bash
docker build -t clipforge:latest .
```

### Run Container
```bash
docker run -p 1111:1111 -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e OPENAI_API_KEY=sk-... \
  -v ./uploads:/app/uploads \
  -v ./clips:/app/clips \
  clipforge:latest
```

### Docker Compose
```bash
docker-compose up -d
```

With vector database:
```bash
docker-compose --profile with-vector-db up -d
```

## VPS Deployment (DigitalOcean/Linode/AWS)

### 1. Create VPS (Ubuntu 22.04 LTS, 4GB RAM, 2vCPU)

### 2. SSH into Server
```bash
ssh root@your-ip
```

### 3. Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -sL https://deb.nodesource.com/setup_18.x | bash
apt install -y nodejs

# Install FFmpeg
apt install -y ffmpeg

# Install yt-dlp
apt install -y python3-pip
pip install yt-dlp

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### 4. Clone Repository
```bash
cd /var/www
git clone https://github.com/your-user/clipforge.git
cd clipforge
```

### 5. Install Application
```bash
npm install
npm run build
```

### 6. Create .env File
```bash
cp .env.example .env
nano .env  # Edit with your API keys
```

### 7. Start with PM2
```bash
pm2 start "npm run server" --name "clipforge"
pm2 save
pm2 startup
```

### 8. Configure Nginx
```bash
# Copy Nginx config
cp nginx.conf /etc/nginx/sites-available/clipforge

# Enable site
ln -s /etc/nginx/sites-available/clipforge /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### 9. Enable HTTPS (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 10. Monitor
```bash
# Check logs
pm2 logs clipforge

# Monitor
pm2 monit

# Check disk usage
df -h
du -sh /var/www/clipforge

# Check memory
free -h
```

## Kubernetes Deployment

### 1. Create Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clipforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clipforge
  template:
    metadata:
      labels:
        app: clipforge
    spec:
      containers:
      - name: clipforge
        image: your-registry/clipforge:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: clipforge-secrets
              key: anthropic-key
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: clipforge-secrets
              key: openai-key
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
        - name: clips
          mountPath: /app/clips
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: uploads
        emptyDir: {}
      - name: clips
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: clipforge-service
spec:
  selector:
    app: clipforge
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 2. Deploy
```bash
kubectl create secret generic clipforge-secrets \
  --from-literal=anthropic-key=sk-ant-... \
  --from-literal=openai-key=sk-...

kubectl apply -f deployment.yaml
```

## Heroku Deployment

### 1. Create Heroku App
```bash
heroku create clipforge
```

### 2. Add Buildpacks
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku-community/heroku-buildpack-ffmpeg.git
```

### 3. Set Environment Variables
```bash
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set NODE_ENV=production
```

### 4. Deploy
```bash
git push heroku main
```

### 5. View Logs
```bash
heroku logs --tail
```

## Vercel (Frontend Only)

### 1. Build Frontend
```bash
npm run build
```

### 2. Deploy to Vercel
```bash
npx vercel
```

### 3. Update API Proxy
Edit `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend.com/api/$1" },
    { "source": "/ws/(.*)", "destination": "https://your-backend.com/ws/$1" }
  ]
}
```

## AWS Deployment

### Option 1: EC2
```bash
# Launch EC2 instance (t3.medium, Ubuntu 22.04)
# Then follow VPS deployment steps above
```

### Option 2: Elastic Beanstalk
```bash
# Create .ebextensions/nodejs.config
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "node server/index.js"

# Deploy
eb init
eb create clipforge-env
eb deploy
```

### Option 3: ECS + Fargate
```bash
# Build and push Docker image
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ECR_URI
docker tag clipforge:latest YOUR_ECR_URI/clipforge:latest
docker push YOUR_ECR_URI/clipforge:latest

# Create ECS task definition and service
# Configure load balancer
# Setup auto-scaling
```

## Google Cloud Deployment

### Cloud Run
```bash
# Build and deploy
gcloud run deploy clipforge \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=sk-ant-...,OPENAI_API_KEY=sk-...
```

### Cloud Storage for clips
```bash
# Create bucket
gsutil mb gs://clipforge-clips

# Update code to use Cloud Storage
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check API health
curl http://your-domain/api/health

# Check WebSocket
wscat -c ws://your-domain/ws/process/test
```

### Logging
```bash
# View logs
tail -f ~/.pm2/logs/clipforge-error.log
tail -f ~/.pm2/logs/clipforge-out.log

# Rotate logs
pm2 install pm2-logrotate
pm2 start pm2-logrotate
```

### Backup
```bash
# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup database (if using SQLite)
cp data/clipforge.db backups/clipforge-$(date +%Y%m%d).db
```

### Updates
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart clipforge
pm2 save
```

## Performance Tuning

### Node.js
```bash
# Increase memory
node --max-old-space-size=4096 server/index.js

# Enable clustering
NODE_CLUSTER=true npm run server
```

### Nginx
```bash
# Increase worker processes
worker_processes auto;

# Increase file descriptors
worker_rlimit_nofile 65535;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1000;
```

### FFmpeg
```bash
# Use hardware acceleration
# Update server/utils/ffmpeg.js with:
# -hwaccel cuda -hwaccel_output_format cuda
# or
# -hwaccel videotoolbox (macOS)
# -hwaccel vaapi (Linux)
```

## Scaling

### Horizontal Scaling
1. Add more backend instances
2. Use load balancer (AWS ELB, Nginx)
3. Share uploads directory (NFS, S3)
4. Use Redis for session storage

### Vertical Scaling
1. Increase server RAM
2. More CPU cores
3. Faster disk (SSD)
4. Use CDN for static files

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Out of Memory
```bash
# Check usage
free -h

# Increase swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew

# Verify
certbot certificates
```

### WebSocket Connection Failed
```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
```

## Production Checklist

- [ ] Update .env with production API keys
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure backups
- [ ] Set up monitoring/alerting
- [ ] Configure logging aggregation
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Test file upload limits
- [ ] Configure cleanup jobs
- [ ] Test failover/recovery
- [ ] Document deployment process
- [ ] Set up CI/CD pipeline
- [ ] Test load handling
- [ ] Document runbooks

---

Choose deployment option that best fits your needs. Docker is recommended for simplicity, VPS for control, and cloud services for scale.
