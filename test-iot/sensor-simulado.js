/**
 * SIMULADOR DE HARDWARE INTERACTIVO (Node.js)
 * 
 * Este script simula un dispositivo IoT físico (Sensor de Movimiento Zigbee)
 * que se conecta al broker público de HiveMQ y publica eventos.
 * 
 * Requisitos:
 * 1. Instalar la librería mqtt: `npm install mqtt`
 * 2. Ejecutar con: `node sensor-simulado.js`
 */

const mqtt = require("mqtt");
const readline = require("readline");

const BROKER_URL = "wss://broker.hivemq.com:8004/mqtt";
const TOPIC = "mmtechouse/pruebas/iot/sensor_movimiento";

console.log("=== SIMULADOR DE HARDWARE IOT ===");
console.log(`Conectando a broker: ${BROKER_URL}`);
console.log(`Topic de publicación: ${TOPIC}\n`);

// Conexión al broker
const client = mqtt.connect(BROKER_URL, {
  clientId: `node_sensor_sim_${Math.random().toString(16).substr(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

// Interfaz de lectura de consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

client.on("connect", () => {
  console.log("✔ Conectado exitosamente al broker HiveMQ.");
  mostrarMenu();
});

client.on("error", (err) => {
  console.error("❌ Error de conexión:", err.message);
});

client.on("close", () => {
  console.log("⚠ Conexión con el broker cerrada.");
});

function mostrarMenu() {
  console.log("\n-------------------------------------------");
  console.log("Selecciona una acción a realizar:");
  console.log("  [1] Detectar Movimiento (occupancy: true)");
  console.log("  [2] Limpiar Área (occupancy: false)");
  console.log("  [3] Enviar ráfaga de estrés (20 mensajes rápidos)");
  console.log("  [4] Enviar JSON corrupto / inválido");
  console.log("  [q] Salir del simulador");
  console.log("-------------------------------------------");
  askUser();
}

function askUser() {
  rl.question("Opción > ", (input) => {
    const option = input.trim();

    if (option === "q" || option === "Q") {
      console.log("Cerrando simulador...");
      client.end();
      rl.close();
      process.exit(0);
    }

    switch (option) {
      case "1": {
        const payload = {
          occupancy: true,
          battery: 92,
          linkquality: 78,
          timestamp: new Date().toISOString()
        };
        publicarMensaje(payload);
        break;
      }
      case "2": {
        const payload = {
          occupancy: false,
          battery: 92,
          linkquality: 75,
          timestamp: new Date().toISOString()
        };
        publicarMensaje(payload);
        break;
      }
      case "3": {
        console.log("Iniciando prueba de estrés (20 mensajes en 2 segundos)...");
        let count = 0;
        const interval = setInterval(() => {
          count++;
          const payload = {
            occupancy: count % 2 === 0,
            stress_index: count,
            battery: Math.floor(Math.random() * 20) + 80,
            linkquality: Math.floor(Math.random() * 30) + 60,
            timestamp: new Date().toISOString()
          };
          publicarMensaje(payload, true);

          if (count >= 20) {
            clearInterval(interval);
            console.log("✔ Ráfaga de estrés completada.");
            setTimeout(mostrarMenu, 500);
          }
        }, 100);
        return; // Retorna para no volver a pintar el menú inmediatamente
      }
      case "4": {
        const corruptPayload = '{"occupancy": true, "battery": 92, "linkquality": ';
        console.log(`Publicando JSON corrupto: "${corruptPayload}"`);
        client.publish(TOPIC, corruptPayload, { qos: 0 }, (err) => {
          if (err) {
            console.error("❌ Error al publicar:", err);
          } else {
            console.log("✔ Mensaje corrupto enviado.");
          }
          mostrarMenu();
        });
        return;
      }
      default:
        console.log("❌ Opción inválida. Intenta de nuevo.");
        mostrarMenu();
        return;
    }
  });
}

function publicarMensaje(payload, isStress = false) {
  const jsonStr = JSON.stringify(payload);
  client.publish(TOPIC, jsonStr, { qos: 0 }, (err) => {
    if (err) {
      console.error("❌ Error al publicar:", err);
    } else if (!isStress) {
      console.log(`✔ Publicado en [${TOPIC}]:`, jsonStr);
      mostrarMenu();
    } else {
      console.log(`⚡ Stress Msg #${payload.stress_index} publicado.`);
    }
  });
}
