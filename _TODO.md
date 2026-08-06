- Passage des metaData pour resend (en utiliant les tag ?)
- Installer les headers dans email-servie-viever
- installer les webhooks dans email-service-viewer

## v0.6.2 — Adresse de réponse (spec : email-service-documentation/cahierDesChargesQD.md, ajout du 6 août 2026)

- [ ] `EmailPayload.replyTo?: FromInput` (défaut = `from`)
- [ ] postMark : `ReplyTo` dans `doSendMail` ET `doSendBulk`
- [ ] resend : `reply_to`
- [ ] brevo : `replyTo`
- [ ] viewer (`emailService.js:20`) : retirer `'server@question.direct'` en dur
- [ ] Filtrer un `Reply-To` présent dans `headers` (jamais deux occurrences —
      même mécanique que `injectUnsubscribeHeader` pour `List-Unsubscribe*`)
- [ ] Viewer : afficher les headers reçus (sinon rien n'est vérifiable en dev)
- [ ] Vérifier ESP par ESP si le `Message-ID` fourni est préservé ou réécrit

## v0.7.0 — Réception (Inbound) — spec : email-service-documentation/cdc-reception-inbound.md

- [ ] `getInboundEmail(userAgent, req, config?, logger?)` + types `InboundResponse` / `InboundMessage`
- [ ] Reconnaissance ESP par User-Agent (même prefix matching que `webHook`)
- [ ] Méthode `inboundManagement` sur `ESP` (défaut : non supporté)
- [ ] postMark : payload complet (corps + headers + PJ base64), aucun appel API
- [ ] resend : webhook = métadonnées → appel API message + PJ ; headers limités
      → repli sur le message brut pour Message-ID / In-Reply-To / References
- [ ] brevo : à qualifier
- [ ] nodemailer : non supporté (explicite)
- [ ] viewer : reconnaissance `email-service-viewer` + normalisation
- [ ] `verifyInboundSignature(esp, headers, rawBody, secret)` (corps BRUT)
- [ ] fixtures `test/fixtures/inbound/` : 1 exemple réel par ESP + cas limites

### Viewer (test en dev)
- [ ] viewer-back : `POST /inbound/simulate` → poste vers le webhook inbound
      configuré, User-Agent `email-service-viewer`
- [ ] viewer-front : bouton **« Répondre »** sur un mail affiché (inReplyTo =
      Message-ID du mail, sujet `Re: `) — le scénario métier réel en un clic
- [ ] viewer-front : formulaire libre (PJ, absence du bureau, sans inReplyTo)
- [ ] viewer : afficher les headers reçus (déjà attendu par v0.6.2)

## Viewer — simulateur de client mail (spec : email-service-documentation/cdc-viewer-simulateur-client-mail.md)

- [ ] Boutons d'événement SUR le message (délivré/ouvert/cliqué/rebond doux/dur/
      plainte/rejeté/différé/abonnement) → POST au webhook, état courant affiché,
      enchaînable sans renvoyer le message ; le déclenchement par adresse RESTE
      (seul utilisable en test automatisé)
- [ ] Bascule « images bloquées » (Outlook / Gmail / Apple Mail par défaut) :
      textes alternatifs visibles, pixel de mesure NON déclenché, liste des
      ressources distantes bloquées (repère un pixel dans un transactionnel)
- [ ] Bouton « Se désabonner » affiché SI ET SEULEMENT SI List-Unsubscribe est
      présent (campagne = oui / transactionnel = non), distinction One-Click
- [ ] Le clic exécute le VRAI POST `List-Unsubscribe=One-Click` → la
      désinscription en un clic devient testable en dev (impossible avec Gmail :
      l'URL locale n'est pas joignable depuis internet)
- ⚠️ Dépend de v0.6.2 : la lib doit transmettre les headers au viewer
