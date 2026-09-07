// netlify/functions/notion-submit.js
//
// Reçoit les données du formulaire d'inscription (JSON) et crée
// directement une ligne dans la base Notion "Inscriptions WDS",
// sans passer par Make/Zapier.
//
// Variables d'environnement requises (à définir dans Netlify,
// Environment variables) :
//   NOTION_API_KEY      -> le "Internal Integration Secret" de ton intégration Notion
//   NOTION_DATABASE_ID  -> l'ID de la base Notion "Inscriptions WDS"

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.error("NOTION_API_KEY ou NOTION_DATABASE_ID manquant dans les variables d'environnement Netlify.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration Notion manquante côté serveur." }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide." }) };
  }

  const contact = data.contact || {};
  const fullName = `${contact.prenom || ""} ${contact.nom || ""}`.trim() || "Sans nom";

  // Ces noms de propriété correspondent EXACTEMENT aux colonnes de la base
  // Notion "Inscriptions WDS" déjà existante.
  const properties = {
    "Nom complet": { title: [{ text: { content: fullName } }] },
    "Ville / Pays": { rich_text: [{ text: { content: contact.ville_pays || "" } }] },
    "Motivation": { rich_text: [{ text: { content: (data.motivation || "").slice(0, 2000) } }] },
  };

  if (contact.prenom) properties["Prénom"] = { rich_text: [{ text: { content: contact.prenom } }] };
  if (contact.nom) properties["Nom"] = { rich_text: [{ text: { content: contact.nom } }] };
  if (contact.email) properties["Email"] = { email: contact.email };
  if (contact.whatsapp) properties["WhatsApp"] = { phone_number: contact.whatsapp };
  if (data.situation) properties["Situation"] = { select: { name: data.situation } };
  if (data.ordi_frequence) properties["Fréquence ordinateur"] = { select: { name: data.ordi_frequence } };
  if (data.ordi_aisance) properties["Aisance ordinateur"] = { select: { name: data.ordi_aisance } };
  if (Array.isArray(data.outils) && data.outils.length) {
    properties["Outils connus"] = { multi_select: data.outils.map((o) => ({ name: String(o).slice(0, 100) })) };
  }
  if (data.source) properties["Source"] = { select: { name: data.source } };
  if (data.engagement) properties["Engagement"] = { rich_text: [{ text: { content: String(data.engagement) } }] };
  if (typeof data.score === "number") properties["Score"] = { number: data.score };
  if (data.statut_prospect) properties["Statut prospect"] = { select: { name: data.statut_prospect } };
  if (data.cohorte) properties["Cohorte"] = { rich_text: [{ text: { content: data.cohorte } }] };
  if (data.cta_clique) properties["CTA source"] = { rich_text: [{ text: { content: data.cta_clique } }] };
  if (data.date) properties["Date d'inscription"] = { date: { start: data.date } };

  try {
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      }),
    });

    if (!notionRes.ok) {
      const errText = await notionRes.text();
      console.error("Erreur API Notion:", notionRes.status, errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Notion a refusé la requête.", details: errText }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Erreur serveur:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur serveur." }) };
  }
};
