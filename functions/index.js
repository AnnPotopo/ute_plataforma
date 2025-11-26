const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// CONFIGURACIÓN DE WHATSAPP (Obten esto de Meta Developers)
const WA_TOKEN = "EAAL2KkZAbQdwBQEXT6Cd1iZCpdUNZB3JZAUKJ4F2Y0uPTX4ZAcU1uO3ljLZBjQDrxTI1rweiT1BGhnjKB1KBaNh4ZC3QeBTZC93Y39Cpds8vCePwCIxk8bnT2IJsiy0wCeRaosvv05W1Wa2Tul4yg4kZBM0BQkuc8A29LWZCtLYBDWbxrTZAqkar8ZAf38eyouWg0bnLqqqRDmZBFzBni85KPZAa135hjZC0ngpqSrCngU2EtRLAMQc1QBZCN561JU25b0Ms1NI0VZAoLbkD568rzDAL7BdGWr8ud";
const WA_PHONE_ID = "890738650788300";
const VERIFY_TOKEN = "UTE123456"; // Tú inventas esta contraseña

// 1. WEBHOOK: Aquí llegan los mensajes de WhatsApp
exports.webhook = functions.https.onRequest(async (req, res) => {
    // Verificación de Meta (Solo se hace una vez al configurar)
    if (req.method === "GET") {
        if (
            req.query["hub.mode"] === "subscribe" &&
            req.query["hub.verify_token"] === VERIFY_TOKEN
        ) {
            res.status(200).send(req.query["hub.challenge"]);
        } else {
            res.sendStatus(403);
        }
        return;
    }

    // Procesar Mensajes Entrantes
    if (req.method === "POST") {
        const body = req.body;

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Número del usuario
                const text = message.text ? message.text.body.toLowerCase() : "";

                await handleUserMessage(from, text);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
});

// LÓGICA DEL BOT
async function handleUserMessage(phone, text) {
    let responseText = "";

    // CASO 1: Consultar Transporte
    if (text.includes("camion") || text.includes("ruta") || text.includes("donde viene")) {
        // Buscamos en la colección 'buses' que tu App.jsx alimenta
        const busesSnapshot = await db.collection("buses").where("status", "!=", "breakdown").get();

        if (busesSnapshot.empty) {
            responseText = "🚌 No hay unidades activas en este momento.";
        } else {
            responseText = "📍 *Estatus del Transporte:*\n";
            busesSnapshot.forEach(doc => {
                const bus = doc.data();
                // Usamos el 'lastCheckpoint' que programamos en TransportMap.jsx
                const location = bus.lastCheckpoint || "En trayecto (sin parada reciente)";

                // Calculamos hace cuánto se actualizó
                const lastUpdate = bus.lastUpdate ? bus.lastUpdate.toDate() : new Date();
                const diffMin = Math.floor((new Date() - lastUpdate) / 60000);

                responseText += `- *${bus.driverName}*: ${location} (Hace ${diffMin} min)\n`;
            });
            responseText += "\nResponde con 'menu' para ver más opciones.";
        }
    }
    // CASO 2: Menú Principal
    else if (text === "hola" || text === "menu") {
        responseText = "👋 Hola, soy el Bot UTE.\n\n1. Escribe *'camion'* para ver ubicación.\n2. Escribe *'inscripciones'* para dudas frecuentes.\n3. Escribe *'carreras'* para oferta educativa.";
    }
    // CASO 3: Dudas Frecuentes
    else if (text.includes("inscripcion")) {
        responseText = "📅 *Inscripciones Abiertas*\nEl proceso inicia el 15 de Agosto. Necesitas:\n- Acta de Nacimiento\n- Certificado de Bachillerato\n- CURP";
    }
    else {
        responseText = "🤖 No entendí tu mensaje. Escribe *'menu'* para ver opciones.";
    }

    // Enviar respuesta a WhatsApp
    await sendMessage(phone, responseText);
}

// 2. NOTIFICACIONES AUTOMÁTICAS (Trigger de Firestore)
// Esto se activa cuando el Admin crea un 'notice' en tu panel
exports.onNewNotice = functions.firestore
    .document("notices/{noticeId}")
    .onCreate(async (snap, context) => {
        const notice = snap.data();

        // Solo notificamos si es ROJO o NARANJA (Importancia alta)
        if (notice.color === "red" || notice.color === "orange") {
            const message = `🚨 *AVISO IMPORTANTE UTE*\n\n${notice.text}\n\n_Enviado desde Plataforma Web_`;

            // AQUÍ: En un caso real, leerías una colección "subscribers"
            // Para demo, pon tu número o un ID de grupo
            const distributionList = ["528112345678"];

            const promises = distributionList.map(phone => sendMessage(phone, message));
            await Promise.all(promises);
        }
    });

// Función auxiliar para enviar a API de Meta
async function sendMessage(to, text) {
    try {
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`,
            headers: {
                "Authorization": `Bearer ${WA_TOKEN}`,
                "Content-Type": "application/json",
            },
            data: {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: text },
            },
        });
    } catch (e) {
        console.error("Error enviando WhatsApp:", e.response ? e.response.data : e.message);
    }
}