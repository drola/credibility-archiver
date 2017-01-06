#!/bin/bash

_term() { 
  echo "Caught SIGTERM signal!" 
  kill -TERM "$child" 2>/dev/null
}
trap _term SIGTERM

chown -R www-data /var/www
supervisord -c /var/www/conf/supervisord.conf &
child=$! 
wait "$child"