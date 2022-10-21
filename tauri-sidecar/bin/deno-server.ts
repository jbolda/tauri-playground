import * as http from "https://deno.land/x/http@v0.2.0/mod.ts";

const server = new http.Server();
let hitCounter = 0;

server.use(
  "/",
  "GET"
)(({ respond }: { respond: any }) => {
  hitCounter++;
  console.log(`someone hit the root url for the ${hitCounter} time(s)`);

  respond({ body: "Hello World!" });
});

console.log("Listening on http://localhost:8000");
server.listen(8000);
