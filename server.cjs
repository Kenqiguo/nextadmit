// Local preview only. Bind to loopback; no dependencies, credentials or cloud services.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405); return res.end();}
  let pathname;
  try {pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
  catch {res.writeHead(400);return res.end('Bad request');}
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(err,bytes) => {
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  });
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 3000 is already in use. Close the other preview and try again.':err.message);process.exitCode=1;});
server.listen(3000,'127.0.0.1',()=>console.log('NextAdmit: http://localhost:3000\nKeep this terminal open. Press Ctrl+C to stop.'));
