const http = require('http');
const os = require('os');

// Define port (uses environment variable PORT or defaults to 3000)
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // Set response header
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Collect basic Linux system info
    const systemInfo = {
        status: "Success",
        message: "Your Node.js test app is running successfully!",
        serverTime: new Date().toISOString(),
        platform: os.platform(),
        architecture: os.arch(),
        totalMemoryGB: (os.totalmem() / (1024 ** 3)).toFixed(2),
        freeMemoryGB: (os.freemem() / (1024 ** 3)).toFixed(2),
        cpuModel: os.cpus()[0]?.model || "Unknown",
        uptimeSeconds: os.uptime()
    };

    // Return the system metrics as JSON
    res.end(JSON.stringify(systemInfo, null, 2));
});

server.listen(PORT, () => {
    console.log(`Server is actively running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}`);
});
