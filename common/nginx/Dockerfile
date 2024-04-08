FROM jonasal/nginx-certbot:4.3.0-nginx1.25.1-alpine

# Copy nginx configuration file and startup script
COPY api_proxy /tmp/api_proxy
COPY start.sh /usr/local/bin/start.sh

# Set execute permissions for the startup script
RUN chmod +x /usr/local/bin/start.sh

# Set the startup script as the entry point
ENTRYPOINT ["/usr/local/bin/start.sh"]