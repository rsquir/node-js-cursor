import http from "node:http";
import mysql from "mysql2/promise";

const port = Number(process.env.PORT) || 3000;

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

async function getData() {
  const [data] = await pool.query("SELECT title, artist FROM musicblog");
  return data;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    try {
      const data = await getData();
      const html = data
        .map(({ title, artist }) => `<p>${title}: ${artist}</p>`)
        .join("\n");

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Database error\n");
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
