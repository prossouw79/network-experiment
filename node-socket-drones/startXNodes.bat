
@echo off

set /p num="Number of client nodes: "
for /L %%n in (1,1,%num%) do (start node socket_client.js)

start node socket_server.js

 start "" http://localhost:3000
 
