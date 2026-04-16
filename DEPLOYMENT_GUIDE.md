# AppGuard AI Frontend - Deployment Guide

## 📦 Build Information

**Build Date:** April 14, 2026  
**Build Tool:** Vite v8.0.3  
**Build Size:** 1.1 MB (compressed)  
**Uncompressed Size:** ~1.5 MB

## 📁 Build Contents

The `trackb-frontend-build.zip` contains:

```
dist/
├── index.html                      (680 bytes)
├── logo11.png                      (1.0 MB)
├── cartel_graph_data.json          (14.7 KB)
├── favicon.svg                     (9.5 KB)
├── icons.svg                       (5.0 KB)
└── assets/
    ├── index-BwXGizZn.css         (49.3 KB)
    └── index-D_NSi34D.js          (355.9 KB)
```

## 🚀 Deployment Instructions

### Option 1: Static Web Server (Recommended)

1. **Extract the zip file:**
   ```bash
   unzip trackb-frontend-build.zip
   ```

2. **Deploy the `dist` folder to your web server:**
   - **Nginx:** Copy to `/var/www/html/appguard/`
   - **Apache:** Copy to `/var/www/html/appguard/`
   - **Cloud Storage:** Upload to S3, GCS, or Azure Blob Storage

3. **Configure web server (if needed):**

   **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name appguard.yourdomain.com;
       root /var/www/html/appguard/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/css application/javascript application/json;
   }
   ```

   **Apache Configuration (.htaccess):**
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

### Option 2: Docker Deployment

1. **Create a Dockerfile:**
   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and run:**
   ```bash
   docker build -t appguard-frontend .
   docker run -d -p 80:80 appguard-frontend
   ```

### Option 3: Quick Local Testing

```bash
# Using Python
cd dist && python3 -m http.server 8080

# Using Node.js (npx)
npx serve dist -p 8080

# Using PHP
cd dist && php -S localhost:8080
```

Then open: http://localhost:8080

## 🔧 Configuration

### API Endpoint Configuration

The frontend is currently configured to use:
- **Backend API:** `http://34.14.189.124:8000`

To change the API endpoint, you'll need to:
1. Update the API URLs in the source code
2. Rebuild the frontend
3. Redeploy

**Files containing API URLs:**
- `src/hooks/useAnalysis.js`
- `src/components/B2CShield.jsx`
- `src/components/AlertsFeed.jsx`
- `src/components/ResultsPanel.jsx` (PDF download)

### CORS Configuration

Ensure your backend API allows requests from your frontend domain:

```javascript
// Backend CORS configuration example
app.use(cors({
  origin: ['http://your-frontend-domain.com', 'https://your-frontend-domain.com'],
  credentials: true
}));
```

## 🌐 Production Checklist

- [ ] Configure HTTPS/SSL certificate
- [ ] Set up CDN (CloudFlare, AWS CloudFront, etc.)
- [ ] Enable gzip/brotli compression
- [ ] Configure caching headers for static assets
- [ ] Set up monitoring and analytics
- [ ] Configure firewall rules
- [ ] Test all API endpoints
- [ ] Verify CORS configuration
- [ ] Test on multiple browsers
- [ ] Mobile responsiveness check

## 📊 Performance Optimization

The build is already optimized with:
- ✅ Code splitting
- ✅ Minification
- ✅ Tree shaking
- ✅ Asset optimization

**Recommended additional optimizations:**
1. Enable HTTP/2 on your web server
2. Use a CDN for static assets
3. Enable browser caching:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 🔒 Security Considerations

1. **Content Security Policy (CSP):**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline'; 
                  style-src 'self' 'unsafe-inline'; 
                  img-src 'self' data:; 
                  connect-src 'self' http://34.14.189.124:8000;">
   ```

2. **HTTPS Only:** Always use HTTPS in production
3. **API Authentication:** Ensure backend has proper authentication
4. **Rate Limiting:** Configure rate limiting on API endpoints

## 🐛 Troubleshooting

### Issue: Blank page after deployment
**Solution:** Check browser console for errors. Ensure all assets are loading correctly.

### Issue: API calls failing
**Solution:** 
1. Check CORS configuration on backend
2. Verify API endpoint is accessible
3. Check browser network tab for error details

### Issue: 404 on page refresh
**Solution:** Configure your web server to serve `index.html` for all routes (see nginx/apache config above)

### Issue: Assets not loading
**Solution:** Ensure the base path is correct. If deploying to a subdirectory, update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/appguard/', // if deploying to /appguard/ subdirectory
  // ...
})
```

## 📞 Support

For issues or questions:
- **Technical Support:** appguard@nic.in
- **Backend API:** http://34.14.189.124:8000/docs (Swagger UI)
- **Project:** RBI HaRBInger 2025 - AppGuard AI

## 📝 Version Information

**Frontend Version:** 2.1  
**React Version:** 18.3.1  
**Vite Version:** 8.0.3  
**Build Date:** April 14, 2026  

**All 9 Track B Requirements Implemented:**
✅ REQ 1 - Separate Static vs Final Score  
✅ REQ 2 - Citizen Portal API Fix  
✅ REQ 3 - PDF Download Button  
✅ REQ 4 - Fix "None" Engine Label  
✅ REQ 5 - Flagged Domains Objects  
✅ REQ 6 - Cartel Graph Classification  
✅ REQ 7 - Alerts Feed  
✅ REQ 8 - Dynamic KFS Compliance  
✅ REQ 9 - Cached App Timing Fix  

---

**Developed by:** YellowSense Technologies  
**For:** Reserve Bank of India · I4C · MeitY  
**Project:** RBI HaRBInger 2025
