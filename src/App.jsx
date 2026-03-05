import { useState, useEffect, useRef } from "react";

// ✅ TEMPORAIRE : Clé hardcodée pour test
// ⚠️ REMPLACEZ par votre vraie clé pk_live_... 
const STRIPE_PUBLIC_KEY = "pk_live_51RxqHVDL6MXKKnhYL9SpgIBrjQjjf3g8hAjHschu7f2Tb19f5xxJfb41PspvGMaQh0XeGEfIXWjqmEif1jL0UqrA00SyQy65Ob";

const STEPS = [
  { id:"company", title:"Votre entreprise", icon:"🏢", fields:[
    {key:"companyName",label:"Nom de l'entreprise",type:"text",placeholder:"ex: MonShop SAS"},
    {key:"legalForm",label:"Forme juridique",type:"select",options:["Auto-entrepreneur","EURL","SARL","SAS","SASU","SA","Autre"]},
    {key:"siret",label:"Numéro SIRET",type:"text",placeholder:"ex: 35219905200016"},
    {key:"address",label:"Adresse du siège social",type:"text",placeholder:"ex: 12 rue de la Paix, 75001 Paris"},
    {key:"email",label:"Email de contact",type:"email",placeholder:"ex: contact@monshop.fr"},
  ]},
  { id:"activity", title:"Votre activité", icon:"🛍️", fields:[
    {key:"productType",label:"Type de produits/services",type:"select",options:["Produits physiques","Produits numériques","Services","Produits physiques + numériques","Formation en ligne"]},
    {key:"productDescription",label:"Description courte",type:"textarea",placeholder:"ex: Vêtements et accessoires de mode pour femmes"},
    {key:"countries",label:"Pays de vente",type:"multiselect",options:["France","Belgique","Suisse","Luxembourg","Espagne","Italie","Allemagne","Pays-Bas","Toute l'Europe"]},
    {key:"currency",label:"Devise principale",type:"select",options:["EUR (€)","CHF (CHF)","GBP (£)","USD ($)"]},
  ]},
  { id:"shipping", title:"Livraison & Retours", icon:"📦", fields:[
    {key:"deliveryDelay",label:"Délai de livraison moyen",type:"select",options:["24-48h","3-5 jours ouvrés","5-10 jours ouvrés","Plus de 10 jours","Non applicable (produit numérique)"]},
    {key:"shippingCost",label:"Frais de livraison",type:"select",options:["Gratuits","Offerts dès un certain montant","À la charge du client","Variables selon destination"]},
    {key:"returnPolicy",label:"Politique de retour",type:"select",options:["14 jours (légal minimum)","30 jours","60 jours","Pas de retour (produits numériques)","Échange uniquement"]},
    {key:"returnCost",label:"Frais de retour",type:"select",options:["À la charge du vendeur","À la charge du client","Partagés"]},
  ]},
  { id:"payment", title:"Paiement & Sécurité", icon:"💳", fields:[
    {key:"paymentMethods",label:"Moyens de paiement acceptés",type:"multiselect",options:["Carte bancaire (Visa/Mastercard)","PayPal","Apple Pay","Google Pay","Virement bancaire","Chèque","Cryptomonnaies"]},
    {key:"paymentProcessor",label:"Prestataire de paiement",type:"select",options:["Stripe","PayPal","Mollie","Lyra/PayZen","Autre / Non précisé"]},
    {key:"dataProcessor",label:"Hébergement des données",type:"select",options:["En Europe (RGPD conforme)","USA (Privacy Shield)","Autre"]},
  ]},
  { id:"language", title:"Langue & Format", icon:"🌍", fields:[
    {key:"outputLanguage",label:"Langue des CGV générées",type:"select",options:["Français","Anglais","Espagnol","Allemand","Néerlandais","Italien"]},
    {key:"additionalClauses",label:"Clauses spécifiques (optionnel)",type:"textarea",placeholder:"ex: clause d'arbitrage, mentions spécifiques à votre secteur..."},
  ]},
];

const MOCK_CGV = `# CONDITIONS GÉNÉRALES DE VENTE

**{companyName}** – {legalForm} – SIRET {siret}
Siège social : {address} | Contact : {email}
*En vigueur au {date}*

---

## ARTICLE 1 – CHAMP D'APPLICATION ET OPPOSABILITÉ

Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les ventes conclues par **{companyName}** ({legalForm}, immatriculée au RCS sous le numéro SIRET {siret}), dont le siège social est situé au {address}, ci-après désignée « le Vendeur ».

Toute commande implique l'acceptation pleine et entière des présentes CGV. Le Vendeur se réserve le droit de modifier ses CGV à tout moment ; les CGV applicables sont celles en vigueur à la date de la commande.

---

## ARTICLE 2 – PRODUITS ET PRIX

Les produits et services proposés sont ceux décrits sur le site au moment de la consultation. Les prix sont indiqués en {currency} toutes taxes comprises (TTC). **{companyName}** se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix applicable est celui en vigueur au moment de la validation de la commande.

En cas d'erreur manifeste de prix, **{companyName}** se réserve le droit d'annuler la commande après en avoir informé le Client.

---

## ARTICLE 3 – COMMANDES ET FORMATION DU CONTRAT

La commande est validée après confirmation par email de **{companyName}**. Le Vendeur se réserve le droit de refuser toute commande pour motif légitime, notamment en cas de litige antérieur ou de suspicion de fraude.

Le Client s'engage à fournir des informations exactes lors de sa commande. **{companyName}** ne pourra être tenu responsable des conséquences d'informations erronées transmises par le Client.

---

## ARTICLE 4 – CONDITIONS DE PAIEMENT

Le paiement est exigible comptant à la commande. Les moyens de paiement acceptés sont : **{paymentMethods}**, via le prestataire de paiement sécurisé **{paymentProcessor}**.

Les données bancaires du Client sont traitées exclusivement par le prestataire de paiement et ne sont jamais stockées par **{companyName}**. En cas de paiement frauduleux, le Vendeur se réserve le droit de poursuites judiciaires.

---

## ARTICLE 5 – LIVRAISON

Les commandes sont livrées aux pays suivants : {countries}. Le délai de livraison moyen est de **{deliveryDelay}** à compter de la confirmation de commande. Les frais de livraison sont : **{shippingCost}**.

En cas de retard de livraison imputable à un transporteur tiers, **{companyName}** ne pourra être tenu responsable. Le Client est invité à contacter le service client à {email} pour tout signalement.

---

## ARTICLE 6 – DROIT DE RÉTRACTATION (Directive 2011/83/UE)

Conformément à l'article L.221-18 du Code de la consommation et à la directive européenne 2011/83/UE, le Client dispose d'un délai de **{returnPolicy}** à compter de la réception du bien pour exercer son droit de rétractation, sans avoir à justifier de motifs.

Pour exercer ce droit, le Client doit notifier sa décision par email à {email}. Les frais de retour sont à la charge de : **{returnCost}**. Le remboursement interviendra dans les 14 jours suivant la réception du retour.

*Exception : le droit de rétractation ne s'applique pas aux biens numériques dont l'exécution a commencé avec l'accord du consommateur avant la fin du délai de rétractation.*

---

## ARTICLE 7 – GARANTIES LÉGALES

**{companyName}** est tenu aux garanties légales de conformité (articles L.217-4 et suivants du Code de la consommation) et contre les vices cachés (articles 1641 et suivants du Code civil). En cas de non-conformité d'un produit vendu, le Client peut le retourner pour échange ou remboursement.

---

## ARTICLE 8 – RESPONSABILITÉ

La responsabilité de **{companyName}** ne pourra être engagée en cas de force majeure, de fait d'un tiers ou de négligence du Client. En tout état de cause, la responsabilité du Vendeur est limitée au montant de la commande concernée.

---

## ARTICLE 9 – PROTECTION DES DONNÉES PERSONNELLES (RGPD)

Conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679), les données personnelles collectées sont utilisées exclusivement pour le traitement des commandes. Les données sont hébergées **{dataProcessor}**.

Le Client dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données en contactant : **{email}**. Les données ne sont jamais cédées à des tiers à des fins commerciales.

---

## ARTICLE 10 – PROPRIÉTÉ INTELLECTUELLE

L'ensemble des contenus présents sur le site de **{companyName}** (textes, images, logos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.

---

## ARTICLE 11 – RÈGLEMENT DES LITIGES ET DROIT APPLICABLE

Les présentes CGV sont soumises au droit français. En cas de litige, le Client peut recourir à la médiation via la plateforme européenne de règlement en ligne des litiges : **https://ec.europa.eu/consumers/odr**. À défaut de résolution amiable, les tribunaux français seront seuls compétents.

---

*Document généré le {date} par LexGen – À titre informatif. Ce document ne se substitue pas à un conseil juridique professionnel. Pour toute activité à risque élevé, nous recommandons une validation par un avocat spécialisé.*`;

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=EB+Garamond:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'EB Garamond', Georgia, serif; background: #f5f0e8; color: #1a1410; overflow-x: hidden; }
  img, svg { display: block; max-width: 100%; }

  /* LAYOUT */
  .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 1.25rem; }
  .container--sm { width: 100%; max-width: 720px; margin: 0 auto; padding: 0 1.25rem; }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #f5f0e8; border-bottom: 1px solid rgba(26,20,16,.12); }
  .nav__inner { display: flex; justify-content: space-between; align-items: center; padding: .875rem 1.25rem; }
  .nav__logo { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: #1a1410; text-decoration: none; cursor: pointer; background: none; border: none; }
  .nav__logo span { color: #b8966a; }
  .nav__links { display: none; align-items: center; list-style: none; gap: 2rem; }
  .nav__link { color: #4a4035; text-decoration: none; font-size: .9rem; }
  .nav__cta { background: #1a1410; color: #f5f0e8 !important; padding: .5rem 1.25rem; font-size: .82rem !important; letter-spacing: .08em; text-transform: uppercase; border: none; cursor: pointer; font-family: inherit; }
  .nav__mobile-cta { display: block; background: #1a1410; color: #f5f0e8; padding: .5rem 1rem; font-size: .8rem; letter-spacing: .06em; text-transform: uppercase; border: none; cursor: pointer; font-family: inherit; }

  /* HERO */
  .hero { padding: 5rem 0 3rem; }
  .hero__eyebrow { display: flex; align-items: center; gap: .75rem; font-size: .75rem; letter-spacing: .2em; text-transform: uppercase; color: #b8966a; margin-bottom: 1.5rem; }
  .hero__eyebrow::before { content: ''; width: 24px; height: 1px; background: #b8966a; flex-shrink: 0; }
  .hero__title { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.05; letter-spacing: -.02em; margin-bottom: 1.25rem; }
  .hero__title em { font-style: italic; color: #b8966a; }
  .hero__sub { font-size: 1.1rem; color: #4a4035; line-height: 1.7; max-width: 520px; margin-bottom: 2rem; }
  .hero__actions { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 2.5rem; }
  .hero__proof { display: flex; flex-wrap: wrap; gap: 1.5rem; padding-top: 2rem; border-top: 1px solid rgba(26,20,16,.1); }
  .proof__item { display: flex; flex-direction: column; }
  .proof__num { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 700; line-height: 1; }
  .proof__label { font-size: .78rem; color: #4a4035; margin-top: .2rem; }

  /* BUTTONS */
  .btn { display: inline-block; padding: .875rem 2rem; font-family: 'EB Garamond', serif; font-size: 1rem; letter-spacing: .06em; cursor: pointer; border: 2px solid transparent; text-decoration: none; text-align: center; transition: all .2s; }
  .btn--dark { background: #1a1410; color: #f5f0e8; border-color: #1a1410; }
  .btn--dark:hover { background: #b8966a; border-color: #b8966a; }
  .btn--outline { background: transparent; color: #1a1410; border-color: #1a1410; }
  .btn--outline:hover { background: #1a1410; color: #f5f0e8; }
  .btn--gold { background: #d4b896; color: #1a1410; border-color: #d4b896; }
  .btn--gold:hover { background: #f5f0e8; border-color: #f5f0e8; }
  .btn--full { width: 100%; }

  /* TRUST BAR */
  .trust { background: #1a1410; color: #f5f0e8; padding: .875rem 1.25rem; }
  .trust__inner { display: flex; flex-wrap: wrap; justify-content: center; gap: .75rem 2rem; font-size: .82rem; letter-spacing: .06em; opacity: .85; }
  .trust__item { display: flex; align-items: center; gap: .5rem; }

  /* SECTIONS */
  .section { padding: 4rem 0; }
  .section--dark { background: #1a1410; color: #f5f0e8; }
  .section--tinted { background: #ede6d6; }
  .section__label { display: flex; align-items: center; gap: .75rem; font-size: .72rem; letter-spacing: .22em; text-transform: uppercase; color: #b8966a; margin-bottom: 1rem; }
  .section__label::after { content: ''; width: 30px; height: 1px; background: #b8966a; }
  .section--dark .section__label { color: #d4b896; }
  .section--dark .section__label::after { background: #d4b896; }
  .section__title { font-family: 'Playfair Display', serif; font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 700; line-height: 1.1; letter-spacing: -.02em; margin-bottom: 1.25rem; }
  .section__title em { font-style: italic; color: #b8966a; }
  .section--dark .section__title em { color: #d4b896; }

  /* PAIN ITEMS */
  .pain-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
  .pain-item { display: flex; gap: 1rem; padding: 1.1rem; background: white; border: 1px solid rgba(26,20,16,.08); }
  .pain-item__icon { font-size: 1.3rem; flex-shrink: 0; }
  .pain-item__title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: .95rem; margin-bottom: .2rem; }
  .pain-item__desc { font-size: .88rem; color: #4a4035; line-height: 1.6; }

  /* QUOTE */
  .quote { padding: 2rem; border: 2px solid #1a1410; position: relative; margin-top: 2rem; }
  .quote::before { content: '"'; position: absolute; top: -1.5rem; left: 1.5rem; font-family: 'Playfair Display', serif; font-size: 5rem; color: #b8966a; line-height: 1; background: #ede6d6; padding: 0 .4rem; }
  .quote__text { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-style: italic; line-height: 1.6; margin-bottom: 1.25rem; }
  .quote__name { font-weight: 700; font-family: 'Playfair Display', serif; font-size: .9rem; }
  .quote__role { font-size: .82rem; color: #4a4035; }

  /* STEPS */
  .steps { display: flex; flex-direction: column; gap: 2rem; margin-top: 2.5rem; }
  .step { display: flex; gap: 1.25rem; align-items: flex-start; }
  .step__num { width: 3rem; height: 3rem; background: #1a1410; color: #f5f0e8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; flex-shrink: 0; }
  .step__title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; margin-bottom: .3rem; }
  .step__desc { font-size: .9rem; color: #4a4035; line-height: 1.6; }

  /* TESTIMONIALS */
  .testi-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; margin-top: 2rem; }
  .testi-card { background: white; padding: 1.5rem; border: 1px solid rgba(26,20,16,.08); }
  .testi-stars { color: #b8966a; font-size: .85rem; margin-bottom: .75rem; }
  .testi-text { font-style: italic; font-size: .92rem; line-height: 1.7; margin-bottom: 1rem; }
  .testi-name { font-family: 'Playfair Display', serif; font-weight: 700; font-size: .9rem; }
  .testi-role { font-size: .78rem; color: #4a4035; }

  /* PRICING */
  .price-card { border: 1px solid rgba(245,240,232,.15); padding: 2rem; background: rgba(245,240,232,.04); margin-top: 2rem; }
  .price-amount { font-family: 'Playfair Display', serif; font-size: 4.5rem; font-weight: 900; line-height: 1; color: #d4b896; }
  .price-currency { font-size: 1.75rem; color: #d4b896; vertical-align: super; }
  .price-desc { font-size: .82rem; color: rgba(245,240,232,.45); margin-bottom: 1.5rem; }
  .price-features { list-style: none; display: flex; flex-direction: column; gap: .75rem; margin-bottom: 2rem; }
  .price-features li { display: flex; gap: .6rem; font-size: .92rem; color: rgba(245,240,232,.85); }
  .price-features li::before { content: '✦'; color: #d4b896; font-size: .65rem; margin-top: .3rem; flex-shrink: 0; }
  .price-note { font-size: .75rem; color: rgba(245,240,232,.3); text-align: center; margin-top: 1rem; }

  /* FAQ */
  .faq-item { border-bottom: 1px solid rgba(26,20,16,.12); padding: 1.5rem 0; cursor: pointer; }
  .faq-q { display: flex; justify-content: space-between; align-items: center; font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 500; gap: 1rem; }
  .faq-icon { color: #b8966a; font-size: 1.4rem; flex-shrink: 0; transition: transform .3s; }
  .faq-item--open .faq-icon { transform: rotate(45deg); }
  .faq-a { max-height: 0; overflow: hidden; transition: max-height .4s ease, padding .3s; font-size: .9rem; color: #4a4035; line-height: 1.8; }
  .faq-item--open .faq-a { max-height: 300px; padding-top: .875rem; }

  /* FOOTER */
  footer { background: #1a1410; color: rgba(245,240,232,.5); padding: 2rem 1.25rem; }
  .footer__inner { display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; }
  .footer__logo { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 900; color: #f5f0e8; }
  .footer__logo span { color: #d4b896; }
  .footer__links { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; justify-content: center; }
  .footer__links a { color: rgba(245,240,232,.35); text-decoration: none; font-size: .82rem; }
  .footer__copy { font-size: .78rem; }

  /* FORM */
  .form-page { position: fixed; inset: 0; background: #f5f0e8; color: #1a1410; z-index: 200; overflow-y: auto; font-family: 'EB Garamond', Georgia, serif; }
  .form-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(26,20,16,.12); position: sticky; top: 0; background: #f5f0e8; z-index: 10; }
  .form-nav__logo { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 900; color: #1a1410; background: none; border: none; cursor: pointer; }
  .form-nav__logo span { color: #b8966a; }
  .form-nav__meta { display: flex; align-items: center; gap: .75rem; }
  .form-nav__step { font-size: .82rem; color: #4a4035; }
  .form-nav__price { padding: .3rem .85rem; background: #1a1410; border-radius: 20px; font-size: .78rem; color: #f5f0e8; font-weight: 700; }
  .progress-bar { height: 3px; background: rgba(26,20,16,.1); }
  .progress-bar__fill { height: 100%; background: linear-gradient(90deg, #b8966a, #d4b896); transition: width .4s ease; }
  .form-body { max-width: 600px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  .form-icon { font-size: 2rem; margin-bottom: .75rem; }
  .form-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; margin-bottom: 1rem; color: #1a1410; }
  .step-dots { display: flex; gap: .35rem; margin-bottom: 2rem; }
  .step-dot { height: 4px; flex: 1; border-radius: 2px; background: rgba(26,20,16,.1); transition: background .3s; }
  .step-dot--active { background: #b8966a; }
  .fields { display: flex; flex-direction: column; gap: 1.25rem; }
  .field__label { display: block; font-size: .78rem; color: #b8966a; letter-spacing: .1em; text-transform: uppercase; margin-bottom: .5rem; }
  .field__input { width: 100%; padding: .85rem 1rem; background: white; border: 1px solid rgba(26,20,16,.2); color: #1a1410; font-size: .95rem; font-family: 'EB Garamond', Georgia, serif; outline: none; transition: border-color .2s; }
  .field__input:focus { border-color: #b8966a; }
  .field__input--error { border-color: #c0392b !important; }
  .field__error { color: #c0392b; font-size: .78rem; margin-top: .35rem; }
  .multiselect { display: flex; flex-wrap: wrap; gap: .5rem; }
  .multi-btn { padding: .45rem .9rem; background: white; border: 1px solid rgba(26,20,16,.2); color: #4a4035; font-size: .82rem; cursor: pointer; font-family: inherit; border-radius: 20px; transition: all .2s; }
  .multi-btn--active { border-color: #b8966a; color: #b8966a; background: rgba(184,150,106,.08); }
  .form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 2.5rem; gap: 1rem; }
  .form-actions .btn-back { background: transparent; border: 1px solid rgba(26,20,16,.2); color: #4a4035; padding: .85rem 1.5rem; font-family: inherit; font-size: .9rem; cursor: pointer; }
  .form-actions .btn-next { background: #1a1410; color: #f5f0e8; border: none; padding: .85rem 2rem; font-family: inherit; font-size: .95rem; font-weight: 700; cursor: pointer; transition: background .2s; }
  .form-actions .btn-next:hover { background: #b8966a; }
  .form-actions .btn-next:disabled { background: rgba(26,20,16,.1); color: rgba(26,20,16,.3); cursor: default; }
  .form-trust { display: flex; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; font-size: .75rem; color: #4a4035; flex-wrap: wrap; }

  /* PAYMENT */
  .pay-card { background: white; border: 1px solid rgba(26,20,16,.12); border-radius: 4px; padding: 1.25rem; margin-bottom: 1rem; }
  .pay-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; padding-bottom: .75rem; border-bottom: 1px solid rgba(26,20,16,.1); }
  .pay-card__name { font-family: 'Playfair Display', serif; font-weight: 700; margin-bottom: .2rem; color: #1a1410; }
  .pay-card__sub { font-size: .78rem; color: #4a4035; }
  .pay-card__price { font-size: 1.4rem; font-weight: 700; color: #b8966a; }
  .pay-card__features { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; font-size: .78rem; color: #4a4035; }
  .pay-label { font-size: .72rem; color: #b8966a; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 1rem; }
  .card-row { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
  .pay-trust { display: flex; justify-content: center; gap: 1.5rem; margin-top: 1rem; font-size: .72rem; color: #4a4035; }

  /* RESULT */
  .result-page { position: fixed; inset: 0; background: #f5f0e8; color: #1a1410; z-index: 200; overflow-y: auto; font-family: 'EB Garamond', Georgia, serif; }
  .result-header { padding: 1.5rem 1.25rem; border-bottom: 1px solid rgba(26,20,16,.12); display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: flex-start; }
  .result-badge { font-size: .72rem; color: #2e7d32; letter-spacing: .15em; text-transform: uppercase; margin-bottom: .4rem; background: #e8f5e9; display: inline-block; padding: .2rem .6rem; border-radius: 3px; }
  .result-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #1a1410; }
  .result-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
  .result-actions button { padding: .65rem 1.25rem; font-family: inherit; font-size: .88rem; cursor: pointer; border-radius: 4px; }
  .result-body { max-width: 780px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
  .result-doc { background: #fff; border: 1px solid rgba(26,20,16,.15); border-radius: 4px; padding: 2rem 2.5rem; line-height: 1.9; font-size: 1rem; max-height: 65vh; overflow-y: auto; color: #1a1410 !important; box-shadow: 0 2px 12px rgba(26,20,16,.06); }
  .result-disclaimer { margin-top: 1.25rem; padding: 1rem; background: #fdf6e3; border: 1px solid #e6d5a0; font-size: .78rem; color: #8a6914; border-radius: 4px; }

  /* GENERATING */
  .gen-page { position: fixed; inset: 0; background: #f5f0e8; color: #1a1410; z-index: 200; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1.5rem; font-family: 'EB Garamond', Georgia, serif; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .spin { animation: spin 2s linear infinite; font-size: 2.5rem; }

  /* DESKTOP ENHANCEMENTS */
  @media(min-width: 768px) {
    .nav__links { display: flex !important; }
    .nav__mobile-cta { display: none !important; }
    .container { padding: 0 2rem; }
    .container--sm { padding: 0 2rem; }
    .nav__inner { padding: 1.1rem 2rem; }
    .hero { padding: 7rem 0 5rem; }
    .hero__title { margin-bottom: 1.5rem; }
    .hero__sub { font-size: 1.2rem; }
    .trust__inner { gap: 1rem 3rem; }
    .section { padding: 6rem 0; }
    .steps { flex-direction: row; gap: 0; }
    .step { flex-direction: column; text-align: center; flex: 1; padding: 0 1.5rem; position: relative; }
    .step:not(:last-child)::after { content: ''; position: absolute; top: 1.4rem; left: calc(50% + 1.8rem); right: calc(-50% + 1.8rem); height: 1px; background: repeating-linear-gradient(90deg, #b8966a 0, #b8966a 5px, transparent 5px, transparent 12px); }
    .step__num { margin: 0 auto 1.5rem; width: 2.8rem; height: 2.8rem; }
    .testi-grid { grid-template-columns: repeat(3, 1fr); }
    .footer__inner { flex-direction: row; justify-content: space-between; text-align: left; padding: 0 2rem; }
    .footer__links { justify-content: flex-start; }
    .form-nav { padding: 1.1rem 2rem; }
    .form-body { padding: 2.5rem 2rem 5rem; }
    .result-header { padding: 1.5rem 2rem; }
    .result-body { padding: 2rem 2rem 5rem; }
    .result-doc { padding: 2.5rem; }
  }

  @media(min-width: 1024px) {
    .nav__inner { padding: 1.25rem 3rem; }
    .hero__actions { gap: 1.5rem; }
    .hero__proof { gap: 2.5rem; }
  }
`;

// ── PAYMENT FORM ──────────────────────────────
function PaymentForm({ onSuccess, onCancel, formData }) {
  const [method, setMethod]         = useState("card");
  const [cardError, setCardError]   = useState("");
  const [processing, setProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const cardElementRef = useRef(null);
  const stripeRef      = useRef(null);
  const elementsRef    = useRef(null);

  useEffect(() => {
    if (window.Stripe) { initStripe(); return; }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = initStripe;
    document.head.appendChild(script);
  }, []);

  const initStripe = () => {
    if (!STRIPE_PUBLIC_KEY) {
      console.error('❌ STRIPE_PUBLIC_KEY manquante');
      setCardError('Configuration Stripe manquante. Contactez le support.');
      return;
    }

    console.log('🔑 Clé Stripe utilisée:', STRIPE_PUBLIC_KEY.substring(0, 20) + '...');
    console.log('🔑 Commence par:', STRIPE_PUBLIC_KEY.substring(0, 8));

    stripeRef.current = window.Stripe(STRIPE_PUBLIC_KEY);
    elementsRef.current = stripeRef.current.elements();
    cardElementRef.current = elementsRef.current.create("card", {
      hidePostalCode: true,
      style: {
        base: { color: "#1a1410", fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", "::placeholder": { color: "#aaa" } },
        invalid: { color: "#c0392b" },
      },
    });
    cardElementRef.current.mount("#stripe-card-element");
    cardElementRef.current.on("ready", () => setStripeReady(true));
    cardElementRef.current.on("change", e => setCardError(e.error ? e.error.message : ""));
  };

  const handleCard = async () => {
    if (!stripeRef.current || !cardElementRef.current) {
      setCardError('Stripe non initialisé');
      return;
    }
    
    setCardError("");
    setProcessing(true);
    
    try {
      console.log('💳 Création payment method...');
      
      const { paymentMethod, error: pmError } = await stripeRef.current.createPaymentMethod({
        type: "card",
        card: cardElementRef.current
      });
      
      if (pmError) {
        setCardError(pmError.message);
        setProcessing(false);
        return;
      }
      
      console.log('✅ Payment method créé:', paymentMethod.id);
      console.log('🔄 Création payment intent...');
      
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          companyName: formData.companyName || ""
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        setCardError(data.error);
        setProcessing(false);
        return;
      }
      
      console.log('✅ Payment intent créé');
      console.log('🔄 Confirmation paiement...');
      
      const { error: confirmError, paymentIntent } = await stripeRef.current.confirmCardPayment(
        data.clientSecret,
        { payment_method: paymentMethod.id }
      );
      
      if (confirmError) {
        setCardError(confirmError.message);
        setProcessing(false);
        return;
      }
      
      if (paymentIntent.status === "succeeded") {
        console.log('✅ Paiement confirmé !');
        setProcessing(false);
        onSuccess();
      } else {
        setCardError(`Paiement ${paymentIntent.status}`);
        setProcessing(false);
      }
      
    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      setCardError("Erreur réseau. Veuillez réessayer.");
      setProcessing(false);
    }
  };

  const handlePayPal = async () => {
    setProcessing(true);
    
    try {
      console.log('🅿️ Redirection PayPal...');
      
      sessionStorage.setItem("lexgen_formdata", JSON.stringify(formData));
      
      const res = await fetch("/api/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: formData.companyName || "" }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.approvalUrl) {
        console.log('✅ Redirection vers PayPal');
        window.location.href = data.approvalUrl;
      } else {
        setCardError(data.error || "Erreur PayPal.");
        setProcessing(false);
      }
      
    } catch (error) {
      console.error('❌ Erreur PayPal:', error);
      setCardError("Erreur réseau. Veuillez réessayer.");
      setProcessing(false);
    }
  };

  const tabStyle = (active) => ({
    flex:1, padding:".75rem", border:"none", cursor:"pointer",
    fontFamily:"'EB Garamond',serif", fontSize:".95rem", fontWeight: active ? 700 : 400,
    background: active ? "#1a1410" : "white",
    color: active ? "#f5f0e8" : "#4a4035",
    borderBottom: active ? "none" : "1px solid rgba(26,20,16,.15)",
    transition:"all .2s",
  });

  return (
    <div className="form-page">
      <div className="form-nav">
        <button className="form-nav__logo" onClick={onCancel}>Lex<span>Gen</span></button>
        <div className="form-nav__meta">
          <span className="form-nav__step">Paiement sécurisé</span>
          <span className="form-nav__price">9 €</span>
        </div>
      </div>
      <div className="form-body">
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"2rem",marginBottom:".5rem"}}>🔒</div>
          <h2 className="form-title" style={{textAlign:"center"}}>Paiement sécurisé</h2>
          <p style={{color:"#4a4035",fontSize:".9rem"}}>Vos CGV personnalisées en quelques secondes</p>
        </div>

        {/* Récap */}
        <div className="pay-card">
          <div className="pay-card__header">
            <div>
              <div className="pay-card__name">Génération CGV complètes</div>
              <div className="pay-card__sub">{formData.companyName||"Votre entreprise"} · {formData.outputLanguage||"Français"}</div>
            </div>
            <div className="pay-card__price">9,00 €</div>
          </div>
          <div className="pay-card__features">
            <span>✓ 11 articles</span><span>✓ Conforme RGPD</span><span>✓ Livraison instantanée</span>
          </div>
        </div>

        {/* Tabs méthode */}
        <div style={{display:"flex",border:"1px solid rgba(26,20,16,.15)",borderRadius:4,overflow:"hidden",marginBottom:"1rem"}}>
          <button style={tabStyle(method==="card")} onClick={()=>setMethod("card")}>💳 Carte bancaire</button>
          <button style={tabStyle(method==="paypal")} onClick={()=>setMethod("paypal")}>🅿 PayPal</button>
        </div>

        {/* Carte */}
        {method==="card" && (
          <div className="pay-card">
            <div className="pay-label">Informations de carte</div>
            <div id="stripe-card-element" style={{padding:".875rem 1rem",background:"white",border:"1px solid rgba(26,20,16,.2)",minHeight:48}}/>
            {!stripeReady && <div style={{fontSize:".78rem",color:"#888",marginTop:".5rem"}}>Chargement...</div>}
            {cardError && <div className="field__error" style={{marginTop:".75rem"}}>⚠ {cardError}</div>}
            <div style={{marginTop:".75rem",fontSize:".75rem",color:"#888"}}>🔒 Vos données ne transitent jamais par nos serveurs</div>
          </div>
        )}

        {/* PayPal */}
        {method==="paypal" && (
          <div className="pay-card" style={{textAlign:"center",padding:"2rem"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>🅿</div>
            <p style={{color:"#4a4035",fontSize:".95rem",marginBottom:"1rem",lineHeight:1.6}}>
              Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
            </p>
            <div style={{fontSize:".78rem",color:"#888"}}>🔒 Paiement sécurisé via PayPal</div>
          </div>
        )}

        <button
          onClick={method==="card" ? handleCard : handlePayPal}
          disabled={processing || (method==="card" && !stripeReady)}
          style={{
            width:"100%", padding:"1rem",
            background: processing || (method==="card" && !stripeReady) ? "rgba(26,20,16,.1)" : "#1a1410",
            color: processing || (method==="card" && !stripeReady) ? "rgba(26,20,16,.3)" : "#f5f0e8",
            border:"none", cursor: processing ? "default" : "pointer",
            fontFamily:"'EB Garamond',serif", fontSize:"1rem", fontWeight:700,
            transition:"background .2s", marginBottom:".75rem",
          }}>
          {processing ? "⏳ Traitement en cours..." : method==="card" ? "Payer 9,00 € par carte" : "Payer 9,00 € via PayPal →"}
        </button>

        <div className="pay-trust"><span>🔒 SSL</span><span>⚡ Stripe</span><span>🅿 PayPal</span><span>🛡 PCI DSS</span></div>
        <div style={{marginTop:"1.5rem",textAlign:"center"}}>
          <button onClick={onCancel} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:".85rem"}}>← Retour au formulaire</button>
        </div>
      </div>
    </div>
  );
}

// ── GENERATOR ─────────────────────────────────
function Generator({ onBackHome }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData]       = useState({});
  const [selectedMulti, setSelectedMulti] = useState({});
  const [screen, setScreen]           = useState("form");
  const [result, setResult]           = useState(null);
  const [copied, setCopied]           = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailSent, setEmailSent]     = useState(false);

  const step     = STEPS[currentStep];
  const progress = ((currentStep) / STEPS.length) * 100;

  const validateSiret = s => {
    const n = s.replace(/[\s.]/g,"");
    if (!n) return "Le numéro SIRET est requis.";
    if (!/^\d+$/.test(n)) return "Le SIRET ne doit contenir que des chiffres.";
    if (n.length!==14) return "Le SIRET doit contenir 14 chiffres (saisi : "+n.length+").";
    return null;
  };
  const validateAddress = a => {
    if (!a||a.trim().length<10) return "Adresse trop courte.";
    if (!/\d/.test(a)) return "L'adresse doit contenir un numéro de rue.";
    if (!/\d{5}/.test(a.replace(/\s/g,""))) return "Doit contenir un code postal (5 chiffres).";
    return null;
  };
  const validateField = (key,val) => key==="siret"?validateSiret(val||""):key==="address"?validateAddress(val||""):null;

  const handleField = (key,val) => { setFormData(p=>({...p,[key]:val})); if(fieldErrors[key]) setFieldErrors(p=>({...p,[key]:null})); };
  const handleBlur  = (key,val) => { const e=validateField(key,val); if(e) setFieldErrors(p=>({...p,[key]:e})); };
  const handleMulti = (key,opt) => { setSelectedMulti(p=>{ const c=p[key]||[],u=c.includes(opt)?c.filter(o=>o!==opt):[...c,opt]; handleField(key,u.join(", ")); return {...p,[key]:u}; }); };

  const isStepValid = () => step.fields.every(f => {
    if (f.key==="additionalClauses") return true;
    if (f.type==="multiselect") return (selectedMulti[f.key]||[]).length>0;
    if (!formData[f.key]?.trim?.()) return false;
    if (f.key==="siret"&&validateSiret(formData[f.key])) return false;
    if (f.key==="address"&&validateAddress(formData[f.key])) return false;
    return true;
  });

  const buildFallback = date => {
    let cgv=MOCK_CGV;
    const r={companyName:formData.companyName||"Votre Entreprise",legalForm:formData.legalForm||"",siret:formData.siret||"XXX",address:formData.address||"",email:formData.email||"",paymentMethods:formData.paymentMethods||"",deliveryDelay:formData.deliveryDelay||"",shippingCost:formData.shippingCost||"",returnPolicy:formData.returnPolicy||"14 jours",returnCost:formData.returnCost||"",dataProcessor:formData.dataProcessor||"en Europe",date};
    Object.entries(r).forEach(([k,v])=>{cgv=cgv.replaceAll(`{${k}}`,v);});
    return cgv;
  };

  // ✅ NOUVEAU : Envoi email avec CGV + facture PDF
  const sendEmail = async (cgvContent) => {
    try {
      console.log('📧 Envoi email en cours...');
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, cgvContent }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('✅ Email envoyé !');
        setEmailSent(true);
      } else {
        console.warn('⚠️ Email non envoyé:', data.error);
      }
    } catch (err) {
      console.error('❌ Erreur envoi email:', err);
    }
  };

  const generateCGV = async () => {
    setScreen("generating");
    const date = new Date().toLocaleDateString("fr-FR");
    
    try {
      console.log('🔄 Appel API génération...');
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData })
      });
      
      if (!res.ok) {
        console.warn(`⚠️ HTTP ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        console.warn('⚠️ Erreur API:', data.error);
        throw new Error(data.error);
      }
      
      console.log('✅ CGV générées avec succès');
      const cgvContent = data.content || buildFallback(date);
      setResult(cgvContent);

      // ✅ Envoi email automatique après génération
      await sendEmail(cgvContent);
      
    } catch (error) {
      console.error('❌ Erreur génération:', error);
      console.log('📄 Utilisation du fallback');
      const cgvContent = buildFallback(date);
      setResult(cgvContent);

      // ✅ Envoi email même avec le fallback
      await sendEmail(cgvContent);
    }
    
    setScreen("result");
  };

  if (screen==="payment") return <PaymentForm formData={formData} onSuccess={generateCGV} onCancel={()=>setScreen("form")} />;

  if (screen==="generating") return (
    <div className="gen-page">
      <div className="spin">⚙️</div>
      <div style={{textAlign:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",marginBottom:".5rem"}}>Paiement confirmé ✓</h2>
        <p style={{color:"#888",fontSize:".9rem"}}>Rédaction de vos CGV personnalisées...</p>
      </div>
    </div>
  );

  if (screen==="result"&&result) return (
    <div className="result-page">
      <div className="result-header">
        <div>
          <div className="result-badge">Paiement confirmé · Document généré ✓</div>
          <div className="result-title">Vos CGV sont prêtes</div>
          {emailSent && (
            <div style={{fontSize:".82rem",color:"#2e7d32",marginTop:".4rem"}}>
              📧 CGV et facture envoyées à {formData.email}
            </div>
          )}
        </div>
        <div className="result-actions">
          <button onClick={()=>{navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?"#2d5a27":"#d4b896",color:copied?"#e8e4dc":"#0a0a0f"}}>{copied?"✓ Copié !":"Copier"}</button>
          <button onClick={()=>{setCurrentStep(0);setFormData({});setSelectedMulti({});setResult(null);setScreen("form");setEmailSent(false);}} style={{background:"transparent",color:"#d4b896",border:"1px solid #d4b896"}}>Nouveau</button>
          <button onClick={onBackHome} style={{background:"transparent",color:"#555",border:"1px solid #333"}}>← Accueil</button>
        </div>
      </div>
      <div className="result-body">
        <div className="result-doc">
          {result.split('\n').map((line,i)=>{
            if(line.startsWith('# ')) return <h1 key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:"#1a1410",borderBottom:"2px solid #1a1410",paddingBottom:".5rem",marginBottom:"1.5rem",letterSpacing:"-.01em"}}>{line.replace('# ','')}</h1>;
            if(line.startsWith('## ')) return <h2 key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#1a1410",marginTop:"1.75rem",marginBottom:".4rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>{line.replace('## ','')}</h2>;
            if(line==='---') return <hr key={i} style={{border:"none",borderTop:"1px solid rgba(26,20,16,.12)",margin:"1.25rem 0"}}/>;
            return <p key={i} style={{margin:line?"0 0 .6rem":"0.6rem 0",color:line.startsWith('*')?"#555":"#1a1410",lineHeight:1.9,fontSize:"1rem"}} dangerouslySetInnerHTML={{__html:line.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#1a1410;font-weight:700">$1</strong>')}}/>;
          })}
        </div>
        <div className="result-disclaimer">⚠️ Ce document est généré à titre informatif et ne remplace pas un conseil juridique professionnel.</div>
      </div>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-nav">
        <button className="form-nav__logo" onClick={onBackHome}>Lex<span>Gen</span></button>
        <div className="form-nav__meta">
          <span className="form-nav__step">Étape {currentStep+1} / {STEPS.length}</span>
          <span className="form-nav__price">9 €</span>
        </div>
      </div>
      <div className="progress-bar"><div className="progress-bar__fill" style={{width:`${progress}%`}}/></div>
      <div className="form-body">
        <div className="form-icon">{step.icon}</div>
        <h2 className="form-title">{step.title}</h2>
        <div className="step-dots">
          {STEPS.map((_,i)=><div key={i} className={`step-dot${i<=currentStep?" step-dot--active":""}`}/>)}
        </div>
        <div className="fields">
          {step.fields.map(field=>(
            <div key={field.key}>
              <label className="field__label">{field.label}</label>
              {field.type==="text"||field.type==="email" ? (<>
                <input type={field.type} className={`field__input${fieldErrors[field.key]?" field__input--error":""}`} placeholder={field.placeholder} value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} onBlur={e=>handleBlur(field.key,e.target.value)} />
                {fieldErrors[field.key]&&<div className="field__error">⚠ {fieldErrors[field.key]}</div>}
              </>):field.type==="textarea"?(
                <textarea className="field__input" placeholder={field.placeholder} value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} rows={3} style={{resize:"vertical"}}/>
              ):field.type==="select"?(
                <select className="field__input" value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} style={{color:formData[field.key]?"#1a1410":"#888",cursor:"pointer",background:"white"}}>
                  <option value="">Sélectionner...</option>
                  {field.options.map(o=><option key={o} value={o} style={{background:"white",color:"#1a1410"}}>{o}</option>)}
                </select>
              ):field.type==="multiselect"?(
                <div className="multiselect">
                  {field.options.map(o=>{const sel=(selectedMulti[field.key]||[]).includes(o);return<button key={o} className={`multi-btn${sel?" multi-btn--active":""}`} onClick={()=>handleMulti(field.key,o)}>{sel?"✓ ":""}{o}</button>;})}
                </div>
              ):null}
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-back" onClick={()=>setCurrentStep(s=>s-1)} disabled={currentStep===0} style={{opacity:currentStep===0?.3:1}}>← Précédent</button>
          {currentStep<STEPS.length-1?(
            <button className="btn-next" onClick={()=>setCurrentStep(s=>s+1)} disabled={!isStepValid()}>Suivant →</button>
          ):(
            <button className="btn-next" onClick={()=>setScreen("payment")} disabled={!isStepValid()}>💳 Payer 9 € →</button>
          )}
        </div>
        {currentStep===STEPS.length-1&&(
          <div className="form-trust"><span>🔒 Stripe</span><span>⚡ 30 secondes</span><span>✓ Remboursé si insatisfait</span></div>
        )}
      </div>
    </div>
  );
}

// ── LANDING ───────────────────────────────────
function Landing({ onStart }) {
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add("vis"); });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const faqs = [
    ["Ces CGV ont-elles une valeur juridique ?","Les CGV générées couvrent les mentions obligatoires imposées par la directive 2011/83/UE et le RGPD. Pour la grande majorité des e-commerçants, elles sont directement utilisables. Nous recommandons une relecture par un professionnel pour les activités à risque élevé."],
    ["Puis-je vendre dans plusieurs pays ?","Oui. Vous sélectionnez plusieurs pays lors de la configuration et choisissez la langue de rédaction parmi 6 options. Les mentions s'adaptent aux marchés sélectionnés."],
    ["Que faire si mon activité change ?","Générez un nouveau document à tout moment pour 9 €. Nous recommandons une mise à jour à chaque changement significatif de votre activité."],
    ["Quelle est votre politique de remboursement ?","Si le document ne vous convient pas, contactez-nous dans les 7 jours. Remboursement intégral, sans question posée."],
  ];

  return (
    <div style={{fontFamily:"'EB Garamond',Georgia,serif",background:"#f5f0e8",color:"#1a1410"}}>

      {/* NAV */}
      <nav className="nav">
        <div className="nav__inner">
          <button className="nav__logo" onClick={onStart}>Lex<span style={{color:"#b8966a"}}>Gen</span></button>
          <button className="nav__mobile-cta" onClick={onStart}>Générer — 9 €</button>
          <ul className="nav__links">
            <li><a href="#comment" className="nav__link">Comment ça marche</a></li>
            <li><a href="#tarif" className="nav__link">Tarif</a></li>
            <li><a href="#faq" className="nav__link">FAQ</a></li>
            <li><button className="nav__cta" onClick={onStart}>Générer mes CGV</button></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <div style={{paddingTop:60}}>
        <div className="hero">
          <div className="container">
            <div className="hero__eyebrow reveal">Conforme droit européen & RGPD</div>
            <h1 className="hero__title reveal">Vos CGV <em>rédigées</em><br/>en 5 minutes.</h1>
            <p className="hero__sub reveal">Fini les templates copiés-collés. LexGen génère des Conditions Générales de Vente personnalisées, conformes et prêtes à l'emploi — pour 9 €.</p>
            <div className="hero__actions reveal">
              <button className="btn btn--dark" onClick={onStart}>Générer mes CGV — 9 €</button>
              <a href="#comment" className="nav__link" style={{fontSize:"1rem"}}>Comment ça marche →</a>
            </div>
            <div className="hero__proof reveal">
              {[["2 400+","Documents générés"],["6","Langues disponibles"],["9 €","Paiement unique"]].map(([n,l])=>(
                <div className="proof__item" key={l}>
                  <span className="proof__num">{n}</span>
                  <span className="proof__label">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRUST */}
      <div className="trust">
        <div className="trust__inner">
          {[["🔒","Paiement sécurisé Stripe"],["⚡","Document en 30 secondes"],["🌍","6 langues"],["✦","Directive 2011/83/UE"]].map(([i,t])=>(
            <div className="trust__item" key={t}><span>{i}</span><span>{t}</span></div>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="section section--tinted">
        <div className="container">
          <div className="section__label reveal">Le problème</div>
          <h2 className="section__title reveal">Ce que les e-commerçants <em>évitent</em><br/>jusqu'au dernier moment</h2>
          <div className="pain-list">
            {[["😰","Avocat trop cher","Un juriste facture entre 300 € et 800 € pour rédiger vos CGV. Hors de portée pour une micro-entreprise."],
              ["📋","Templates inutilisables","Les modèles gratuits sont génériques, non conformes à votre activité et potentiellement obsolètes."],
              ["⚖️","Risque juridique réel","Des CGV absentes exposent à des amendes DGCCRF pouvant atteindre 15 000 €."]
            ].map(([icon,title,desc])=>(
              <div className="pain-item reveal" key={title}>
                <div className="pain-item__icon">{icon}</div>
                <div><div className="pain-item__title">{title}</div><div className="pain-item__desc">{desc}</div></div>
              </div>
            ))}
          </div>
          <div className="quote reveal">
            <p className="quote__text">"J'ai lancé ma boutique Shopify sans CGV pendant 8 mois. Un client m'a menacé d'une plainte. Ça m'aurait coûté une fortune si j'avais attendu encore."</p>
            <div className="quote__name">Marie-Claire D.</div>
            <div className="quote__role">Auto-entrepreneuse, boutique cosmétiques naturels</div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="section" id="comment">
        <div className="container">
          <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
            <div className="section__label reveal" style={{justifyContent:"center"}}>Comment ça marche</div>
            <h2 className="section__title reveal">Trois étapes, <em>c'est tout.</em></h2>
          </div>
          <div className="steps">
            {[["1","Remplissez le formulaire","15 questions sur votre activité. Moins de 3 minutes."],
              ["2","Payez 9 €","Paiement sécurisé par carte. Paiement unique, aucun abonnement."],
              ["3","Récupérez votre document","CGV générées instantanément. Copiez-collez sur votre site."]
            ].map(([num,title,desc])=>(
              <div className="step reveal" key={num}>
                <div className="step__num">{num}</div>
                <div><div className="step__title">{title}</div><div className="step__desc">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section--tinted">
        <div className="container">
          <div style={{textAlign:"center",marginBottom:"2rem"}}>
            <div className="section__label reveal" style={{justifyContent:"center"}}>Témoignages</div>
            <h2 className="section__title reveal">Ce qu'en disent <em>nos clients</em></h2>
          </div>
          <div className="testi-grid">
            {[["★★★★★","Impeccable. J'ai rempli le formulaire en 4 minutes, les CGV étaient prêtes immédiatement.","Thomas B.","Fondateur SaaS, Paris"],
              ["★★★★★","Enfin un outil sérieux. Les CGV sont en français juridique propre, ça inspire confiance.","Sophie L.","Boutique mode, Lyon"],
              ["★★★★☆","Pour 9 €, c'est vraiment imbattable. Les CGV sont adaptées à mon activité de formation.","Julien M.","Formateur, Bordeaux"]
            ].map(([stars,text,name,role])=>(
              <div className="testi-card reveal" key={name}>
                <div className="testi-stars">{stars}</div>
                <p className="testi-text">"{text}"</p>
                <div className="testi-name">{name}</div>
                <div className="testi-role">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section section--dark" id="tarif">
        <div className="container--sm">
          <div className="section__label reveal">Tarif</div>
          <h2 className="section__title reveal">Simple, <em>transparent.</em></h2>
          <p className="reveal" style={{color:"rgba(245,240,232,.6)",lineHeight:1.8,marginBottom:".5rem"}}>Pas d'abonnement. Pas de frais cachés. Vous payez une fois, vous recevez vos CGV immédiatement.</p>
          <div className="price-card reveal">
            <div><span className="price-currency">€</span><span className="price-amount">9</span></div>
            <div className="price-desc">Paiement unique · Sans abonnement</div>
            <ul className="price-features">
              {["CGV complètes en 8+ articles","Personnalisées à votre activité","Conformes directive 2011/83/UE & RGPD","6 langues disponibles","Livraison instantanée","Satisfait ou remboursé"].map(f=><li key={f}>{f}</li>)}
            </ul>
            <button className="btn btn--gold btn--full" onClick={onStart} style={{fontSize:"1rem",fontWeight:700,padding:"1rem"}}>Générer mes CGV maintenant</button>
            <div className="price-note">🔒 Paiement sécurisé · Satisfait ou remboursé</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container--sm">
          <div style={{textAlign:"center",marginBottom:"2rem"}}>
            <div className="section__label reveal" style={{justifyContent:"center"}}>FAQ</div>
            <h2 className="section__title reveal">Vos questions, <em>nos réponses</em></h2>
          </div>
          {faqs.map(([q,a],i)=>(
            <div key={i} className={`faq-item reveal${faqOpen===i?" faq-item--open":""}`} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
              <div className="faq-q">{q}<span className="faq-icon">+</span></div>
              <div className="faq-a">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section section--tinted" style={{textAlign:"center"}}>
        <div className="container--sm">
          <div className="section__label reveal" style={{justifyContent:"center"}}>Prêt ?</div>
          <h2 className="section__title reveal">Protégez votre activité <em>aujourd'hui.</em></h2>
          <p className="reveal" style={{fontSize:"1.05rem",color:"#4a4035",marginBottom:"2rem",lineHeight:1.7}}>Rejoignez plus de 2 400 e-commerçants qui ont sécurisé leur boutique. 5 minutes et 9 €.</p>
          <button className="btn btn--dark reveal" onClick={onStart} style={{fontSize:"1.05rem",padding:"1rem 2.5rem"}}>Générer mes CGV — 9 € →</button>
          <p className="reveal" style={{marginTop:"1rem",fontSize:".82rem",color:"#4a4035"}}>Paiement sécurisé · Livraison instantanée · Satisfait ou remboursé</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer__inner" style={{maxWidth:1100,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
          <div className="footer__logo">Lex<span>Gen</span></div>
          <div className="footer__copy">© 2026 LexGen. Tous droits réservés.</div>
          <div className="footer__links">
            {["Mentions légales","Confidentialité","Contact"].map(l=><a href="#" key={l}>{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  return (
    <>
      <style>{globalCss}</style>
      {page==="generator"
        ? <Generator onBackHome={()=>setPage("landing")} />
        : <Landing onStart={()=>setPage("generator")} />
      }
    </>
  );
}