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
