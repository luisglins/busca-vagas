/**
 * Busca Vagas — envia os alertas de vagas do LinkedIn (que chegam no seu Gmail) para o site.
 *
 * Como instalar (uma vez só):
 * 1. Acesse script.google.com > Novo projeto. Apague o conteúdo e cole este arquivo.
 * 2. Engrenagem (Configurações do projeto) > Propriedades do script > Adicionar propriedade:
 *      Propriedade: INGEST_SECRET
 *      Valor:       só o código depois do "=" na linha INGEST_SECRET do .env.local (sem "INGEST_SECRET=")
 * 3. Rode a função `instalar` uma vez (botão Executar) e autorize o acesso ao Gmail.
 *    Ela cria um gatilho que roda `enviarAlertasLinkedin` de hora em hora.
 *
 * O script só LÊ os e-mails de alerta do LinkedIn e marca cada um com o marcador "busca-vagas"
 * para não mandar duas vezes. Nada é enviado ao LinkedIn.
 */
const URL_SITE = "https://busca-vagas-livid.vercel.app/api/ingest/linkedin";
const MARCADOR = "busca-vagas";

function enviarAlertasLinkedin() {
  // Tolera os enganos comuns ao colar: "INGEST_SECRET=..." inteiro, aspas ou espaços.
  const segredo = (PropertiesService.getScriptProperties().getProperty("INGEST_SECRET") || "")
    .replace(/^\s*INGEST_SECRET\s*=\s*/, "")
    .replace(/["'\s]/g, "");
  if (!segredo) throw new Error("Falta a propriedade INGEST_SECRET (veja o passo 2).");
  const rotulo = GmailApp.getUserLabelByName(MARCADOR) || GmailApp.createLabel(MARCADOR);
  const conversas = GmailApp.search(
    "from:(jobalerts-noreply@linkedin.com OR jobs-noreply@linkedin.com) newer_than:7d -label:" + MARCADOR,
    0,
    20,
  );
  conversas.forEach(function (conversa) {
    conversa.getMessages().forEach(function (mensagem) {
      const resposta = UrlFetchApp.fetch(URL_SITE, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + segredo },
        payload: JSON.stringify({ texto: mensagem.getPlainBody(), html: mensagem.getBody() }),
        muteHttpExceptions: true,
      });
      Logger.log(mensagem.getSubject() + " -> " + resposta.getResponseCode() + " " + resposta.getContentText());
      if (resposta.getResponseCode() !== 200) throw new Error("O site recusou: " + resposta.getContentText());
    });
    conversa.addLabel(rotulo);
  });
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (g) {
    if (g.getHandlerFunction() === "enviarAlertasLinkedin") ScriptApp.deleteTrigger(g);
  });
  ScriptApp.newTrigger("enviarAlertasLinkedin").timeBased().everyHours(1).create();
  enviarAlertasLinkedin();
}
