import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const port = Number(process.env.PORT) || 3000;
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const artworkDir = path.join(rootDir, "artwork");

const pool = mysql.createPool({
  host: "localhost",
  user: "musicblog-cursor",
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

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function itemNum(row) {
  return String(row.num ?? "").padStart(2, "0");
}

function colorIndex(num) {
  const parsed = Number.parseInt(num, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed % 5;
}

function compareNumDesc(a, b) {
  return Number.parseInt(itemNum(b), 10) - Number.parseInt(itemNum(a), 10);
}

function songBlock(row) {
  const num = itemNum(row);
  const color = colorIndex(num);
  const title = escapeHtml(row.title);
  const artist = escapeHtml(row.artist);
  const genre = escapeHtml(row.genre);
  const date = escapeHtml(row.date);
  const description = escapeHtml(row.description);
  const apple = escapeAttr(row.apple_link);
  const spotify = escapeAttr(row.spotify_link);
  const youtube = escapeAttr(row.youtube_link);

  return `<div id="${num}" class="bg-${color}">
		<div class="container-fluid">
			<div class="row element align-items-center">
				<div class="col-sm-4 d-flex flex-row flex-sm-column align-items-center text-center">
					<div class="col-sm-6 col-num-img">
						<h1 class="num">${num}</h1>
					</div>
					<div class="col-sm-6 col-num-img">
						<img class="rounded-2 border border-2" src="/artwork/${num}.jpg" alt="${title}"/>
					</div>
				</div>
				<div class="col-sm-8 text-col">
					<h1 class="title"><b>${title}</b> <span class="artist">by ${artist}</span></h1>
					<p class="genre text-end">${genre} • ${date}</p>
					<p class="description">${description}</p>
					<div class="text-center">
						<button type="button" class="btn text-reset" onclick="showEmbed('${num}', 'apple', '${apple}')"><i class="fa-brands fa-itunes"></i></button>
						<button type="button" class="btn text-reset" onclick="showEmbed('${num}', 'spotify', '${spotify}')"><i class="fa-brands fa-spotify"></i></button>
						<button type="button" class="btn text-reset" onclick="showEmbed('${num}', 'youtube', '${youtube}')"><i class="fa-brands fa-youtube"></i></button>
						<button type="button" class="btn text-reset" onclick="send('${num}')"><i class="fa-regular fa-thumbs-up ${num}-thumb"></i></button>
					</div>
					<p class="explanation text-center">Apple, Spotify and Youtube links above, click the thumbs up if you like the song.<br/>(Use the Youtube link if you would like the entire song)</p>
					<div class="embed-${num} text-center">
						
					</div>
				</div>
			</div>
		</div>
	</div>`;
}

function midNote(color, html) {
  return `<div class="bg-${color}">
		<div class="container-fluid">
			<div class="row mid align-items-center text-center">
				${html}
			</div>
		</div>
	</div>`;
}

function rowsToBlog(rows) {
  const songs = [...rows].sort(compareNumDesc);
  const parts = [];

  for (const row of songs) {
    const num = itemNum(row);
    parts.push(songBlock(row));

    if (num === "10") {
      parts.push(
        midNote(
          colorIndex(num),
          "<p>Planning to update the blog weekly, will be updating more during this initial launch.</p>"
        )
      );
    }

    if (num === "07") {
      parts.push(
        midNote(
          colorIndex(num),
          `<p>If you'd like to talk music join my discord server. I'm always looking for new stuff <a href="https://discord.gg/PHp4ThkQtJ">https://discord.gg/PHp4ThkQtJ</a></p>`
        )
      );
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="only light">
	<title>My Music Blog</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
	<script src="https://kit.fontawesome.com/2596e616c8.js" crossorigin="anonymous"></script>
	<style>
		:root {
			--red-colour:  		#FA5659;
			--orange-colour: 	#F7A34A;
			--yellow-colour:	#f5cb40;
			--green-colour: 	#62B64D;
			--blue-colour: 		#227694;
			--purple-colour: 	#484572;
			--white-colour: 	#FAFAFA;
		}
		body {
			font-family: "Montserrat";
			background-color: var(--white-colour);
		}
		.bg-0 	 	{ color: var(--purple-colour); }
		.bg-1 	 	{ color: var(--red-colour); }
		.bg-2    	{ color: var(--orange-colour); }
		.bg-3 	 	{ color: var(--green-colour); }
		.bg-4    	{ color: var(--blue-colour); }
		.form-0	input.btn	{ color: var(--purple-colour);
							  border-color: var(--purple-colour) !important; }
		.form-1	input.btn	{ color: var(--red-colour);
							  border-color: var(--red-colour) !important; }
		.form-2	input.btn	{ color: var(--orange-colour);
							  border-color: var(--orange-colour) !important; }
		.form-3	input.btn	{ color: var(--green-colour);
							  border-color: var(--green-colour) !important; }
		.form-4	input.btn	{ color: var(--blue-colour);
							  border-color: var(--blue-colour) !important; }
		input.btn 			{ padding: 3px 1px;
							  margin: -2px 0 0 2px; }
		div.header   { padding-top: 12px; }
		.header p 	 { font-size: 10pt;
					   margin: 2px 0 0 0; }
		.mid a   	 { color: inherit; }
		.element     { max-width: 900px; padding: 12px; margin: 0 auto; }
		div.col-num-img { width: 100%; }
		h1.num      	{ font-size: 80pt;
					  	  display: inline; }
		img         	{ width: 120px;
					  	  margin: 0 0 0 8px; }
		h1, h1 i    	{ font-size: 24pt; }
		h1.title     	{ font-weight: 300; padding: 20px 0 4px 0; }
		span.artist		{ font-style: italic; font-weight: 200; }
		p.genre			{ font-size: 12pt; font-weight: 300; }
		p.description  	{ font-size: 14pt; font-weight: 300; }
		p.explanation 	{ font-weight: 400; padding: 8px 0;
						  font-size: 10pt; }
		i           	{ font-size: 30pt; }
		@media (min-width: 575px) {
			img    		 { width: 120px; }
		}
		form, button { display: inline; }
	</style>
</head>
<body>
	<div class="bg-1 form-1">
		<div class="container-fluid">
			<div class="row header align-items-center text-center">
				<form id="emailer">
            		<input type="email" name="email" placeholder="email"><input class="btn btn-outline-custom" type="submit" value="Subscribe">
          		</form>
          		<p id="form-reply">Subscribe to the website</p>
			</div>
		</div>
	</div>
	<br/>
	${parts.join("\n\t<br/>\n\t<br/>\n\t")}
	<br/>
	<br/>
</body>
<script>
	function send(val) {
		const thumbs_up = document.getElementsByClassName(val + "-thumb");
		if (thumbs_up[0]) {
			thumbs_up[0].classList.add("fa-solid");
			thumbs_up[0].classList.remove("fa-regular");
		}
	}

	function showEmbed(num, kind, link) {
		const element = document.querySelector(".embed-" + num);
		if (!element) {
			return;
		}

		if (element.classList.contains(kind)) {
			element.classList.remove(kind);
			element.innerHTML = "";
			return;
		}

		element.textContent = "";
		element.classList.remove("apple", "spotify", "youtube");

		switch (kind) {
		case "apple":
			element.classList.add(kind);
			element.innerHTML = '<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="' + link + '"></iframe>';
			break;
		case "spotify":
			element.classList.add(kind);
			element.innerHTML = '<iframe data-testid="embed-iframe" style="border-radius:12px" src="' + link + '?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
			break;
		case "youtube":
			element.classList.add(kind);
			element.innerHTML = '<iframe src="' + link + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
			break;
		}
	}

	const myForm = document.getElementById("emailer");
	if (myForm) {
		myForm.addEventListener("submit", (event) => {
			event.preventDefault();
			document.getElementById("form-reply").innerHTML = "Subscribe is not wired up on the Node server yet";
		});
	}
</script>
</html>`;
}

function sendArtwork(req, res) {
  const url = new URL(req.url, "http://localhost");
  const match = url.pathname.match(/^\/artwork\/(\d{2})\.jpg$/);
  if (!match) {
    return false;
  }

  const filePath = path.join(artworkDir, `${match[1]}.jpg`);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Artwork not found\n");
      return;
    }

    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(data);
  });
  return true;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && sendArtwork(req, res)) {
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    try {
      const rows = await getMusicItems();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(rowsToBlog(rows));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      const code = error && typeof error === "object" && "code" in error ? error.code : "";
      const stack = error instanceof Error ? error.stack : "";
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        `Database error\n\n${code ? `code: ${code}\n` : ""}message: ${message}\n${stack ? `\n${stack}\n` : ""}`
      );
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
