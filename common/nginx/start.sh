#!/bin/bash

# Substitute environment variables in the nginx configuration file
envsubst < /tmp/api_proxy > /etc/nginx/api_proxy

# Start Nginx
/scripts/start_nginx_certbot.sh