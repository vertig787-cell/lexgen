export default async function handler(req, res) {
  // Configuration CORS pour autoriser les requêtes depuis le frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vérifier que c'est bien une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Récupérer les données du formulaire
  const { formData } = req.body;

  if (!formData) {
    return res.status(400).json({ error: 'formData requis' });
  }

  console.log('📝 Génération CGV pour:', formData.companyName);

  // Date actuelle
  const date = new Date().toLocaleDateString("fr-FR");

  // Template de CGV (on utilisera l'IA plus tard)
  const cgvContent = `# CONDITIONS GÉNÉRALES DE VENTE

**${formData.companyName}** – ${formData.legalForm} – SIRET ${formData.siret}
Siège social : ${formData.address} | Contact : ${formData.email}
*En vigueur au ${date}*

---

## ARTICLE 1 – CHAMP D'APPLICATION ET OPPOSABILITÉ

Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les ventes conclues par **${formData.companyName}** (${formData.legalForm}, immatriculée au RCS sous le numéro SIRET ${formData.siret}), dont le siège social est situé au ${formData.address}, ci-après désignée « le Vendeur ».

Toute commande implique l'acceptation pleine et entière des présentes CGV. Le Vendeur se réserve le droit de modifier ses CGV à tout moment ; les CGV applicables sont celles en vigueur à la date de la commande.

---

## ARTICLE 2 – PRODUITS ET PRIX

Les produits et services proposés sont de type : **${formData.productType}** - ${formData.productDescription || 'Non précisé'}.

Les prix sont indiqués en ${formData.currency} toutes taxes comprises (TTC). **${formData.companyName}** se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix applicable est celui en vigueur au moment de la validation de la commande.

En cas d'erreur manifeste de prix, **${formData.companyName}** se réserve le droit d'annuler la commande après en avoir informé le Client.

---

## ARTICLE 3 – COMMANDES ET FORMATION DU CONTRAT

La commande est validée après confirmation par email de **${formData.companyName}**. Le Vendeur se réserve le droit de refuser toute commande pour motif légitime, notamment en cas de litige antérieur ou de suspicion de fraude.

Le Client s'engage à fournir des informations exactes lors de sa commande. **${formData.companyName}** ne pourra être tenu responsable des conséquences d'informations erronées transmises par le Client.

---

## ARTICLE 4 – CONDITIONS DE PAIEMENT

Le paiement est exigible comptant à la commande. Les moyens de paiement acceptés sont : **${formData.paymentMethods}**, via le prestataire de paiement sécurisé **${formData.paymentProcessor}**.

Les données bancaires du Client sont traitées exclusivement par le prestataire de paiement et ne sont jamais stockées par **${formData.companyName}**. En cas de paiement frauduleux, le Vendeur se réserve le droit de poursuites judiciaires.

---

## ARTICLE 5 – LIVRAISON

Les commandes sont livrées aux pays suivants : ${formData.countries}. Le délai de livraison moyen est de **${formData.deliveryDelay}** à compter de la confirmation de commande. Les frais de livraison sont : **${formData.shippingCost}**.

En cas de retard de livraison imputable à un transporteur tiers, **${formData.companyName}** ne pourra être tenu responsable. Le Client est invité à contacter le service client à ${formData.email} pour tout signalement.

---

## ARTICLE 6 – DROIT DE RÉTRACTATION (Directive 2011/83/UE)

Conformément à l'article L.221-18 du Code de la consommation et à la directive européenne 2011/83/UE, le Client dispose d'un délai de **${formData.returnPolicy}** à compter de la réception du bien pour exercer son droit de rétractation, sans avoir à justifier de motifs.

Pour exercer ce droit, le Client doit notifier sa décision par email à ${formData.email}. Les frais de retour sont à la charge de : **${formData.returnCost}**. Le remboursement interviendra dans les 14 jours suivant la réception du retour.

*Exception : le droit de rétractation ne s'applique pas aux biens numériques dont l'exécution a commencé avec l'accord du consommateur avant la fin du délai de rétractation.*

---

## ARTICLE 7 – GARANTIES LÉGALES

**${formData.companyName}** est tenu aux garanties légales de conformité (articles L.217-4 et suivants du Code de la consommation) et contre les vices cachés (articles 1641 et suivants du Code civil). En cas de non-conformité d'un produit vendu, le Client peut le retourner pour échange ou remboursement.

---

## ARTICLE 8 – RESPONSABILITÉ

La responsabilité de **${formData.companyName}** ne pourra être engagée en cas de force majeure, de fait d'un tiers ou de négligence du Client. En tout état de cause, la responsabilité du Vendeur est limitée au montant de la commande concernée.

---

## ARTICLE 9 – PROTECTION DES DONNÉES PERSONNELLES (RGPD)

Conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679), les données personnelles collectées sont utilisées exclusivement pour le traitement des commandes. Les données sont hébergées **${formData.dataProcessor}**.

Le Client dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données en contactant : **${formData.email}**. Les données ne sont jamais cédées à des tiers à des fins commerciales.

---

## ARTICLE 10 – PROPRIÉTÉ INTELLECTUELLE

L'ensemble des contenus présents sur le site de **${formData.companyName}** (textes, images, logos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.

---

## ARTICLE 11 – RÈGLEMENT DES LITIGES ET DROIT APPLICABLE

Les présentes CGV sont soumises au droit français. En cas de litige, le Client peut recourir à la médiation via la plateforme européenne de règlement en ligne des litiges : **https://ec.europa.eu/consumers/odr**. À défaut de résolution amiable, les tribunaux français seront seuls compétents.

---

*Document généré le ${date} par LexGen – À titre informatif. Ce document ne se substitue pas à un conseil juridique professionnel. Pour toute activité à risque élevé, nous recommandons une validation par un avocat spécialisé.*`;

  // Retourner les CGV générées
  return res.status(200).json({ 
    content: cgvContent,
    generated_at: new Date().toISOString(),
    company: formData.companyName
  });
}