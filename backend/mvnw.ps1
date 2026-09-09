$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$ScriptDir\..\.tools\apache-maven-3.9.9\bin\mvn.cmd" $args
