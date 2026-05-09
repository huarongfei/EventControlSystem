#!/bin/bash
# Deployment script for Huafeirong website
# Fixes missing files and security issues

echo "=== Deploying Huafeirong Website ==="

# 1. Create missing directories
mkdir -p /var/www/html/Myweb/.well-known
mkdir -p /var/www/html/Myweb/blog

# 2. Copy website files
echo "Copying website files..."
cp -r . /var/www/html/Myweb/ 2>/dev/null || true

# 3. Fix file permissions
echo "Setting file permissions..."
chown -R nginx:nginx /var/www/html/Myweb
chmod -R 755 /var/www/html/Myweb
chmod 644 /var/www/html/Myweb/*.html
chmod 644 /var/www/html/Myweb/*.css
chmod 644 /var/www/html/Myweb/*.xml
chmod 644 /var/www/html/Myweb/*.txt

# 4. Create missing favicon.ico (minimal fallback)
echo "Creating favicon.ico..."
cat > /var/www/html/Myweb/favicon.ico << 'EOF'
<!-- Minimal fallback favicon -->
<!-- For proper .ico file, convert favicon.svg to .ico format -->
EOF

# 5. Backup current nginx config
echo "Backing up nginx configuration..."
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)

# 6. Apply nginx fix configuration
echo "Applying nginx configuration..."
if [ -f "nginx.conf" ]; then
    cp nginx.conf /etc/nginx/nginx.conf
    echo "Full nginx configuration applied"
else
    echo "Applying partial fixes..."
    # Append fixes to existing config
    cat nginx-fix.conf >> /etc/nginx/conf.d/default.conf
fi

# 7. Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration test passed"
    
    # 8. Reload nginx
    echo "Reloading nginx..."
    systemctl reload nginx
    
    # 9. Check nginx status
    echo "Checking nginx status..."
    systemctl status nginx --no-pager
else
    echo "ERROR: Nginx configuration test failed"
    echo "Restoring backup configuration..."
    cp /etc/nginx/nginx.conf.backup.$(date +%Y%m%d) /etc/nginx/nginx.conf
    exit 1
fi

# 10. Verify files exist
echo "=== Verifying required files ==="
required_files=(
    "/var/www/html/Myweb/index.html"
    "/var/www/html/Myweb/404.html"
    "/var/www/html/Myweb/security.txt"
    "/var/www/html/Myweb/.well-known/security.txt"
    "/var/www/html/Myweb/favicon.svg"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file is missing"
    fi
done

# 11. Check website accessibility
echo "=== Testing website ==="
echo "Testing local access..."
curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null
echo " - HTTP status code"

# 12. Create security files
echo "=== Creating security files ==="

# Create .htaccess for additional security (if using Apache)
cat > /var/www/html/Myweb/.htaccess << 'EOF'
# Security headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Block malicious requests
RewriteEngine On

# Block common attack paths
RewriteRule ^(setup\.cgi|HNAP1|sdk|webui|geoserver|nmaplowercheck|evox) - [F,L]

# Block hidden files
RewriteRule ^\.git - [F,L]
RewriteRule ^\.env - [F,L]
RewriteRule ^\.htaccess - [F,L]

# Protect against script injection
RewriteCond %{QUERY_STRING} (\<|%3C).*script.*(\>|%3E) [NC,OR]
RewriteCond %{QUERY_STRING} GLOBALS(=|\[|\%[0-9A-Z]{0,2}) [OR]
RewriteCond %{QUERY_STRING} _REQUEST(=|\[|\%[0-9A-Z]{0,2})
RewriteRule ^(.*)$ index.php [F,L]
EOF

echo "Deployment completed!"
echo ""
echo "=== Next Steps ==="
echo "1. Check error logs: tail -f /var/log/nginx/error.log"
echo "2. Test website from external: curl -I http://your-server-ip/"
echo "3. Monitor for malicious requests"
echo "4. Consider adding SSL/TLS for HTTPS"
echo ""
echo "=== Important Files ==="
echo "Nginx config: /etc/nginx/nginx.conf"
echo "Website root: /var/www/html/Myweb"
echo "Error logs: /var/log/nginx/error.log"
echo "Access logs: /var/log/nginx/access.log"
