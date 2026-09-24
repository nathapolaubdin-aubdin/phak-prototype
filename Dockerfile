# Static site: serve ./workspace with nginx (for the company server / internal hosting).
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY workspace/ /usr/share/nginx/html/
EXPOSE 80
