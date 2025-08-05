# Smart Home SaaS Dashboard - Deployment Guide

## Overview
This guide provides instructions for deploying the Smart Home SaaS Dashboard to production environments.

## System Requirements

### Server Requirements
- Node.js 18+ or Node.js 20+
- PostgreSQL 12+ (or Supabase)
- Memory: 512MB+ RAM
- Storage: 1GB+ available space
- Network: HTTPS support for WebSocket connections

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration  
PORT=5000
NODE_ENV=production

# Optional: External Service API Keys
STRIPE_SECRET_KEY=sk_live_...
ZENDESK_API_TOKEN=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

## Database Setup

### Option 1: Supabase (Recommended)
1. Create a Supabase project at https://supabase.com
2. Go to Settings → Database
3. Copy the "Connection string" under "Transaction pooler"
4. Replace `[YOUR-PASSWORD]` with your database password
5. Set as `DATABASE_URL` environment variable

### Option 2: Self-hosted PostgreSQL
1. Install PostgreSQL 12+
2. Create database: `createdb smarthome_dashboard`
3. Set connection string: `postgresql://user:pass@localhost:5432/smarthome_dashboard`

### Database Schema Migration
```bash
npm run db:push
```

## Deployment Options

### Option 1: Replit Deployment (Easiest)
1. Click the "Deploy" button in Replit
2. Configure environment variables in Secrets
3. Deploy to production

### Option 2: Manual Server Deployment
```bash
# Clone repository
git clone <repository-url>
cd smart-home-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# Set environment variables
export DATABASE_URL="your-database-url"
export NODE_ENV=production

# Start production server
npm start
```

### Option 3: Docker Deployment
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

## Production Configuration

### Security Headers
The application includes:
- CORS configuration for API access
- Input validation and sanitization
- SQL injection prevention via Drizzle ORM
- XSS protection through proper escaping

### Performance Optimizations
- Vite build optimization for production
- WebSocket connection pooling
- Database query optimization
- Static asset caching

### Monitoring Setup
```bash
# Health check endpoint
GET /api/system-health

# Monitor these metrics:
- Response times < 100ms
- WebSocket connection count
- Database query performance
- Memory usage < 512MB
```

## Environment-Specific Settings

### Development
- Uses Vite dev server
- Hot module replacement enabled
- Detailed error logging
- In-memory storage fallback

### Production
- Serves static built assets
- Compressed responses
- Error logging without stack traces
- Database persistence required

## SSL/HTTPS Setup

### For WebSocket Connections
WebSocket connections require secure connections (WSS) in production:

```javascript
// Client automatically detects protocol
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws`;
```

### Certificate Configuration
- Use Let's Encrypt for free SSL certificates
- Configure reverse proxy (nginx/Apache) for SSL termination
- Ensure WebSocket upgrades work through proxy

## Database Backup Strategy

### Automated Backups
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Retention: Keep 30 days of backups
find /backups -name "backup_*.sql" -mtime +30 -delete
```

### Supabase Backups
- Automatic daily backups included
- Point-in-time recovery available
- Cross-region replication for Pro plans

## Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple app instances
- Implement session affinity for WebSocket connections
- Consider Redis for shared session storage

### Database Scaling
- Connection pooling (already configured)
- Read replicas for reporting queries
- Index optimization for large datasets

### WebSocket Scaling
- Use sticky sessions or shared state
- Consider Redis for pub/sub across instances
- Monitor connection limits

## Monitoring and Alerts

### Application Metrics
- API response times
- WebSocket connection count
- Database query performance
- Memory and CPU usage

### Alert Thresholds
- API response time > 500ms
- Database connections > 80%
- Memory usage > 80%
- WebSocket disconnection rate > 10%

### Log Analysis
```bash
# Key log patterns to monitor
grep "ERROR" /var/log/app.log
grep "WebSocket error" /var/log/app.log
grep "Database connection" /var/log/app.log
```

## Troubleshooting Guide

### Common Issues

1. **WebSocket Connection Fails**
   - Check HTTPS/WSS configuration
   - Verify firewall allows WebSocket upgrades
   - Test with browser dev tools Network tab

2. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database user has proper permissions

3. **CORS Errors**
   - Verify Access-Control headers
   - Check origin whitelist configuration
   - Test with different browsers

4. **Performance Issues**
   - Monitor database query performance
   - Check memory usage and garbage collection
   - Analyze WebSocket message frequency

### Debug Commands
```bash
# Check application logs
docker logs <container-id>

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://your-domain.com/ws

# Verify API endpoints
curl https://your-domain.com/api/dashboard-summary
```

## Rollback Procedures

### Application Rollback
1. Keep previous deployment artifacts
2. Use blue-green deployment strategy
3. Database migrations should be backward compatible

### Database Rollback
1. Stop application
2. Restore from backup
3. Update application to compatible version
4. Restart application

## Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated regularly
- [ ] HTTPS enforced for all connections
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data
- [ ] Regular security updates applied
- [ ] Access logs monitored for suspicious activity

## Maintenance Schedule

### Weekly
- Check application logs for errors
- Monitor performance metrics
- Verify backup completion

### Monthly
- Update dependencies
- Review security alerts
- Optimize database performance
- Check disk space usage

### Quarterly
- Security audit
- Performance testing
- Disaster recovery testing
- Review and update documentation