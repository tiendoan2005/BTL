@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0backend"
call "..\.tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
pause
