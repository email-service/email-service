- installer les webhooks dans email-service-viewer

## v0.6.2 — Adresse de réponse et en-têtes — FAIT (spec : email-service-documentation/cahierDesChargesQD.md, ajout du 6 août 2026)

- [x] `EmailPayload.replyTo?: FromInput` (défaut = `from`)
- [x] postMark : `ReplyTo` dans `doSendMail` ET **`sendMailMultiple`** — et non
      `doSendBulk`, qui n'existe pas : `sendBulk` passe par `sendMail` et hérite
      donc du correctif sans modification
- [x] resend : `reply_to`
- [x] brevo : `replyTo` — **en objet `{ email, name }`**, comme l'exige l'API
      (idem `sender`, qui recevait la valeur brute)
- [x] viewer (`emailService.ts:25`) : retirer `'server@question.direct'` en dur
- [x] Filtrer un `Reply-To` présent dans `headers` — via `stripHeaders`,
      **insensible à la casse** : `injectUnsubscribeHeader` comparait strictement
      et laissait passer un `list-unsubscribe` en minuscules
- [x] Viewer : afficher les headers reçus (+ Reply-To avec badge « ≠ From »,
      Cc/Bcc, Tag, Message-ID, metaData) — repo `email-service-viewer-front`
- [x] Passage des metaData pour resend en utilisant les tags
- [x] Installer les headers dans email-service-viewer
- [x] **Réparer les en-têtes chez Brevo et Postmark** — non prévu au CDC initial :
      Brevo les avait commentés, Postmark les envoyait en `[{name,value}]` alors
      que son API exige `[{Name,Value}]`. Aucun en-tête personnalisé n'atteignait
      ces deux ESP, `List-Unsubscribe` compris
- [x] **Normalisation des adresses centralisée** dans `ESP.sendMail()` — seul
      Resend appelait `checkFrom` ; ailleurs un `from` en chaîne nue produisait
      `From: undefined`
- [x] Tests : `npm test` (Vitest, 40 cas sur les bodies construits, sans réseau)
      + `test/manual-replyto.mjs` (envoi réel vers le viewer)

### Formats vérifiés le 2026-08-06 sur les documentations officielles

- Postmark : `Headers: [{ Name, Value }]`, `ReplyTo` = chaîne
- Brevo : `headers` objet clé/valeur, `replyTo` et `sender` = objets `{email,name}`
- Resend : `headers` objet, `reply_to` = chaîne ; **`tags` présents dans les
  webhooks, `headers` absents** → les tags sont le seul canal de retour pour
  `metaData`. Le webhook expose aussi `message_id` (RFC).

- [ ] Vérifier ESP par ESP si le `Message-ID` fourni est préservé ou réécrit
      (Resend : à confirmer sur un envoi réel — son webhook expose de toute
      façon `message_id`, donc le rapprochement reste possible)

## v0.7.0 — Réception (Inbound) — LOT A FAIT (spec : email-service-documentation/cdc-reception-inbound.md)

- [x] `getInboundEmail(userAgent, req, config?, logger?)` + types `InboundResponse` / `InboundMessage`
      → **`data` est un TABLEAU** : Brevo groupe plusieurs messages par webhook
- [x] Reconnaissance ESP par User-Agent (même prefix matching que `webHook`)
- [x] Méthode `inboundManagement` sur `ESP` (défaut : non supporté)
- [x] postMark : payload complet (corps + headers + PJ base64), aucun appel API
- [x] resend : webhook = métadonnées → appel API message ; headers limités
      → repli **systématique** (et non exceptionnel) sur le message brut, lu en
      requête partielle `Range: bytes=0-65535` pour ne pas rapatrier les PJ
- [x] brevo : **qualifié** — corps ET headers complets (In-Reply-To/References)
      dans le webhook, `ExtractedMarkdownMessage` ≈ StrippedTextReply, PJ via
      `DownloadToken` remonté sans être consommé → aucun appel API nominal
- [x] nodemailer : non supporté (explicite)
- [x] viewer : reconnaissance `email-service-viewer` + normalisation
- [x] `verifyInboundSignature(esp, headers, rawBody, secret)` (corps BRUT)
      → seul Resend signe (Svix) ; Postmark/Brevo répondent « non applicable »
      plutôt que « valide », pour ne pas laisser croire à une vérification
- [x] fixtures `test/fixtures/inbound/` : 7 fichiers, 1 exemple par ESP + cas
      limites (PJ, absence du bureau, non-remise, sans inReplyTo, lot Brevo,
      en-têtes incomplets Resend + message brut)
- [x] `Recipient`, `FromInput`, `RecipientInput`, `HeadersPayLoad` exportés —
      ils ne l'étaient pas, le consommateur ne pouvait pas typer ce qu'il reçoit
- [x] 78 tests verts (dont les 8 tests d'acceptation du CDC)

### Reste sur v0.7.0

- [ ] Essai réel Brevo (compte utilisateur) — éprouver `items[]` en conditions
- [ ] Vérifier que CloudFront honore bien `Range` sur l'URL signée de Resend
      (repli sur téléchargement complet déjà en place si ce n'est pas le cas)

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
