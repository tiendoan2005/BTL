@echo off
rem Chay backend Spring Boot - moi truong local may nay
set JAVA_HOME=C:\Users\admin\.jdks\ms-17.0.19
set PATH=%JAVA_HOME%\bin;C:\BTL\.tools\apache-maven-3.9.9\bin;%PATH%
set DB_USERNAME=root
set DB_PASSWORD=123456789A
cd /d C:\BTL\backend
call mvn -q spring-boot:run
