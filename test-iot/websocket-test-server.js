/**
 * SERVIDOR DE PRUEBAS LOCAL WEBSOCKET (Sin dependencias)
 * 
 * Este script levanta un servidor WebSocket local en el puerto 8080.
 * Envía eventos de movimiento alternos (occupancy: "true" / "false")
 * cada 5 segundos para probar el "Modo Conexión Real" del Constructor de Nodos.
 * 
 * Ejecución:
 * `node websocket-test-server.js`
 */

const http = require("http");
const crypto = require("crypto");

const PORT = 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Servidor de pruebas WebSocket IoT local activo. Conéctate vía ws://localhost:8080");
});

// Enviar un frame de texto WebSocket
function sendTextFrame(socket, text) {
  const payload = Buffer.from(text, "utf-8");
  const len = payload.length;

  let header;
  if (len <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Opcode 1 (text)
    header[1] = len;
  } else if (len <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  socket.write(Buffer.concat([header, payload]));
}

// Handshake de WebSocket
server.on("upgrade", (req, socket, head) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  // Generar llave de aceptación del protocolo WebSocket
  const hash = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${hash}`,
    "\r\n"
  ];

  socket.write(headers.join("\r\n"));
  console.log("\n✔ Cliente conectado al servidor local WebSocket.");

  // Enviar mensaje inicial
  sendTextFrame(socket, JSON.stringify({ message: "Conectado al simulador local de M&M Tech House" }));

  // Enviar alternadamente el sensor de movimiento cada 5 segundos
  let isOccupied = true;
  const interval = setInterval(() => {
    const payload = {
      topic: "zigbee2mqtt/motion",
      payload: {
        occupancy: isOccupied ? "true" : "false"
      }
    };
    console.log(`📤 Enviando telemetría de sensor: ${JSON.stringify(payload)}`);
    sendTextFrame(socket, JSON.stringify(payload));
    isOccupied = !isOccupied;
  }, 5000);

  // Escuchar comandos del cliente
  socket.on("data", (data) => {
    try {
      const firstByte = data[0];
      const opcode = firstByte & 0x0f;
      if (opcode === 8) {
        console.log("❌ Cliente cerrado.");
        clearInterval(interval);
        return;
      }

      const secondByte = data[1];
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;

      let keyOffset = 2;
      if (payloadLength === 126) {
        keyOffset = 4;
      } else if (payloadLength === 127) {
        keyOffset = 10;
      }

      if (isMasked) {
        // Desmascarar los datos recibidos del navegador
        const mask = data.slice(keyOffset, keyOffset + 4);
        const rawPayload = data.slice(keyOffset + 4);
        const decoded = Buffer.alloc(rawPayload.length);
        for (let i = 0; i < rawPayload.length; i++) {
          decoded[i] = rawPayload[i] ^ mask[i % 4];
        }
        console.log(`📥 [Comando recibido del lienzo]: ${decoded.toString("utf-8")}`);
      }
    } catch (e) {
      // Ignorar errores de paquetes en pruebas
    }
  });

  socket.on("close", () => {
    clearInterval(interval);
    console.log("❌ Conexión con el cliente cerrada.");
  });

  socket.on("error", (err) => {
    clearInterval(interval);
    console.error("❌ Error de socket:", err);
  });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Servidor de prueba local WebSocket IoT activo.`);
  console.log(`Dirección local: ws://localhost:${PORT}`);
  console.log(`===================================================`);
  console.log(`El servidor enviará automáticamente un evento de`);
  console.log(`presencia cada 5 segundos al lienzo.`);
  console.log(`Presiona Ctrl+C para finalizar.`);
  console.log(`===================================================`);
});
