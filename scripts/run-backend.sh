#!/bin/bash
# Chạy backend Spring Boot - môi trường local máy này
export JAVA_HOME="/c/Users/admin/.jdks/ms-17.0.19"
export PATH="$JAVA_HOME/bin:/c/BTL/.tools/apache-maven-3.9.9/bin:$PATH"
export DB_USERNAME=root
export DB_PASSWORD='123456789A'
cd /c/BTL/backend
exec mvn -q spring-boot:run
