import http from "node:http";
import mysql from "mysql2/promise";

const port = Number(process.env.PORT) || 3000;

const pool = mysql.createPool({
  host: "173.105.29.213",
  user: "musicblog",
  password: "2805854Rs!",
  database: "musicblog",
  waitForConnections: true,
  connectionLimit: 10,
});

async function getMusicItems() {
  const [rows] = await pool.query("SELECT * FROM music_items");
  return rows;
}

function escapeHtml(value) {
  if (value == null) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rowsToHtml(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "<p>No rows in music_items</p>";
  }

  const columns = Object.keys(rows[0]);
  const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(row[column])}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table border="1" cellpadding="8" cellspacing="0">
  <thead><tr>${header}</tr></thead>
  <tbody>${body}</tbody>
</table>`;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    try {
      const rows = await getMusicItems();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(rowsToHtml(rows));
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
