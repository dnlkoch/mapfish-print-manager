FROM camptocamp/mapfish_print:3.16.1

ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Duser.timezone=UTC -Xmx512M"

CMD [ "catalina.sh", "run"]

# Run with
# docker build -t mapfish-print-manager/example .
# docker run -v /home/dkoch/Dokumente/workspace/mapfish-print-manager/docker/print-apps:/usr/local/tomcat/webapps/ROOT/print-apps:Z -p 18082:8080 -t mapfish-print-manager/example
