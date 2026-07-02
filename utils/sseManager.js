class SSEManager {
  constructor() {
    this.clients = new Set();
    
    // Heartbeat every 30 seconds to keep connections alive
    setInterval(() => {
      this.clients.forEach(client => {
        client.res.write(':\n\n');
      });
    }, 30000);
  }

  addClient(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    
    // Disable buffering for Nginx/proxies
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial keep-alive comment
    res.write(':\n\n');

    const client = { req, res };
    this.clients.add(client);

    req.on('close', () => {
      this.clients.delete(client);
    });
  }

  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
        this.clients.delete(client);
      }
    });
  }
}

// Export a singleton instance
module.exports = new SSEManager();
