FROM mdrolc/node:latest

COPY . /var/www/
VOLUME /var/www/data

RUN cd /var/www/ && \
	yarn install && \
	mkdir -p ./data/screenshots && \
	chown -R www-data . && \
	{ crontab -l -u user; echo '@hourly /usr/bin/node $HOME/scrape.js'; } | crontab -u www-data -

CMD ["supervisord", "-c",  "/var/www/conf/supervisord.conf"]
