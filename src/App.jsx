import { useState, useEffect, useRef } from "react";

const STRIPE_KEY = "pk_test_51RxqHxDiHCfv0XMm4yoGqT4wj4jZlLQZBcmM6LcqF3Y10Vz1fmiA9oRHZ9jnIYg5pLLubYA8QYB4RcnVAvZ9LuTX00bEGPqjod";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
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

**{companyName}** – En vigueur au {date}

---

## ARTICLE 1 – CHAMP D'APPLICATION

Les présentes CGV s'appliquent à l'ensemble des ventes conclues par **{companyName}** ({legalForm}, SIRET {siret}), dont le siège social est situé au {address}.

---

## ARTICLE 2 – PRIX

Les prix sont indiqués en euros TTC. **{companyName}** se réserve le droit de modifier ses prix à tout moment.

---

## ARTICLE 3 – COMMANDES

La vente sera considérée définitive après confirmation par email de **{companyName}**.

---

## ARTICLE 4 – CONDITIONS DE PAIEMENT

Paiement comptant par : {paymentMethods}.

---

## ARTICLE 5 – LIVRAISONS

Délai de livraison : {deliveryDelay}. Frais de livraison : {shippingCost}.

---

## ARTICLE 6 – DROIT DE RÉTRACTATION

Le Client dispose de {returnPolicy} à compter de la réception. Frais de retour : {returnCost}.

---

## ARTICLE 7 – PROTECTION DES DONNÉES (RGPD)

Données hébergées {dataProcessor}. Contact : {email}.

---

## ARTICLE 8 – DROIT APPLICABLE

Les présentes CGV sont régies par le droit français.

---

*Document généré le {date} – À titre informatif. Non substituable à un conseil juridique professionnel.*`;

// ─────────────────────────────────────────────
// STYLES PARTAGÉS
// ─────────────────────────────────────────────
const C = {
  ink:"#1a1410", inkLight:"#4a4035", cream:"#f5f0e8", creamDark:"#ede6d6",
  gold:"#b8966a", goldLight:"#d4b896", dark:"#0a0a0f", darkCard:"#13131a",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .page-reset{display:block!important;grid-template-columns:none!important;}
  html{scroll-behavior:smooth;}
  body{overflow-x:hidden;}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity 0.7s ease,transform 0.7s ease;}
  .reveal.vis{opacity:1;transform:translateY(0);}
  .d1{transition-delay:0.1s}.d2{transition-delay:0.2s}.d3{transition-delay:0.3s}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes floatDoc{0%,100%{transform:rotate(-2deg) translateY(0)}50%{transform:rotate(-2deg) translateY(-14px)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .hero-anim-1{opacity:0;animation:fadeUp 0.8s 0.2s forwards;}
  .hero-anim-2{opacity:0;animation:fadeUp 0.8s 0.4s forwards;}
  .hero-anim-3{opacity:0;animation:fadeUp 0.8s 0.6s forwards;}
  .hero-anim-4{opacity:0;animation:fadeUp 0.8s 0.8s forwards;}
  .hero-anim-5{opacity:0;animation:fadeUp 0.8s 1.0s forwards;}
  .doc-float{animation:floatDoc 4s ease-in-out infinite;}
  .btn-primary{background:#1a1410;color:#f5f0e8;padding:1rem 2.5rem;font-family:'EB Garamond',serif;font-size:1rem;letter-spacing:0.08em;border:2px solid #1a1410;cursor:pointer;text-decoration:none;display:inline-block;transition:all 0.25s;position:relative;overflow:hidden;}
  .btn-primary:hover{background:#b8966a;border-color:#b8966a;}
  .faq-a{max-height:0;overflow:hidden;transition:max-height 0.4s ease,padding 0.3s;}
  .faq-open .faq-a{max-height:300px;padding-top:1rem;}
  .faq-icon{transition:transform 0.3s;}
  .faq-open .faq-icon{transform:rotate(45deg);}
  .pain-item{transition:border-color 0.2s,transform 0.2s;}
  .pain-item:hover{border-color:#b8966a!important;transform:translateX(4px);}
  .testi-card{transition:transform 0.2s,box-shadow 0.2s;}
  .testi-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(26,20,16,0.1)!important;}
  .step-num{transition:background 0.3s;}
  .step:hover .step-num{background:#b8966a!important;}
  select option{background:#1a1410;color:#f5f0e8;}
`;

// ─────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────
function Landing({ onStart }) {
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const revealRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("vis"); });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqs = [
    ["Ces CGV ont-elles une valeur juridique réelle ?","Les CGV générées couvrent les mentions obligatoires imposées par la directive 2011/83/UE et le RGPD. Pour la grande majorité des e-commerçants, elles sont directement utilisables. Nous recommandons une relecture par un professionnel pour les activités à risque élevé."],
    ["Puis-je générer des CGV pour plusieurs pays ?","Oui. Vous sélectionnez plusieurs pays de vente lors de la configuration et choisissez la langue parmi 6 options. Les mentions s'adaptent aux marchés sélectionnés."],
    ["Que se passe-t-il si ma situation change ?","Vous pouvez générer un nouveau document à tout moment pour 9 €. Nous recommandons une mise à jour à chaque changement significatif de votre activité."],
    ["Le document inclut-il les mentions légales ?","LexGen génère les CGV. Les mentions légales obligatoires de votre site (éditeur, hébergeur) sont un document distinct — rapide à rédiger séparément."],
    ["Quelle est votre politique de remboursement ?","Si le document ne vous convient pas, contactez-nous dans les 7 jours. Remboursement intégral, sans question."],
  ];

  const s = (obj) => obj; // passthrough for style objects

  return (
    <div style={{fontFamily:"'EB Garamond',Georgia,serif",background:C.cream,color:C.ink,fontSize:18,lineHeight:1.6,overflowX:"hidden"}}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 4rem",background:C.cream,borderBottom:`1px solid rgba(26,20,16,0.12)`,boxShadow:scrolled?"0 2px 20px rgba(26,20,16,0.08)":"none",transition:"box-shadow 0.3s"}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",fontWeight:900,letterSpacing:"-0.02em"}}>Lex<span style={{color:C.gold}}>Gen</span></span>
        <div style={{display:"flex",gap:"2.5rem",alignItems:"center"}}>
          <a href="#comment" style={{color:C.inkLight,textDecoration:"none",fontSize:"0.9rem",letterSpacing:"0.05em"}}>Comment ça marche</a>
          <a href="#tarif" style={{color:C.inkLight,textDecoration:"none",fontSize:"0.9rem",letterSpacing:"0.05em"}}>Tarif</a>
          <a href="#faq" style={{color:C.inkLight,textDecoration:"none",fontSize:"0.9rem",letterSpacing:"0.05em"}}>FAQ</a>
          <button onClick={onStart} style={{background:C.ink,color:C.cream,padding:"0.6rem 1.5rem",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:"0.85rem",letterSpacing:"0.1em",textTransform:"uppercase",transition:"background 0.2s"}}
            onMouseOver={e=>e.target.style.background=C.gold} onMouseOut={e=>e.target.style.background=C.ink}>
            Générer mes CGV
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr",paddingTop:80,position:"relative",overflow:"hidden"}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"5rem 4rem",zIndex:2}}>
          <div className="hero-anim-1" style={{display:"inline-flex",alignItems:"center",gap:"0.75rem",fontSize:"0.8rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,marginBottom:"2rem"}}>
            <span style={{width:30,height:1,background:C.gold,display:"block"}}></span>
            Conforme droit européen & RGPD
          </div>
          <h1 className="hero-anim-2" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(3rem,5vw,5rem)",fontWeight:900,lineHeight:1.05,letterSpacing:"-0.02em",marginBottom:"2rem"}}>
            Vos CGV <em style={{fontStyle:"italic",color:C.gold}}>rédigées</em><br/>en 5 minutes.
          </h1>
          <p className="hero-anim-3" style={{fontSize:"1.2rem",color:C.inkLight,maxWidth:420,lineHeight:1.7,marginBottom:"3rem"}}>
            Fini les templates copiés-collés qui n'engagent que vous. LexGen génère des CGV personnalisées, conformes et prêtes à l'emploi — pour 9 €.
          </p>
          <div className="hero-anim-4" style={{display:"flex",alignItems:"center",gap:"2rem"}}>
            <button onClick={onStart} className="btn-primary">Générer mes CGV — 9 €</button>
            <a href="#comment" style={{color:C.inkLight,textDecoration:"none",fontSize:"0.9rem",letterSpacing:"0.05em"}}>Voir comment ça marche →</a>
          </div>
          <div className="hero-anim-5" style={{display:"flex",gap:"2.5rem",marginTop:"4rem"}}>
            {[["2 400+","Documents générés"],["6","Langues disponibles"],["9 €","Paiement unique"]].map(([num,label],i)=>(
              <div key={i} style={{display:"flex",gap:"0 2.5rem",alignItems:"center"}}>
                {i>0 && <div style={{width:1,background:"rgba(26,20,16,0.15)",alignSelf:"stretch",marginRight:"2.5rem"}}/>}
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:700,lineHeight:1}}>{num}</div>
                  <div style={{fontSize:"0.8rem",color:C.inkLight,letterSpacing:"0.05em",marginTop:"0.25rem"}}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doc preview */}
        <div style={{background:C.creamDark,borderLeft:`1px solid rgba(26,20,16,0.1)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(26,20,16,0.04) 28px,rgba(26,20,16,0.04) 29px)"}}/>
          <div className="doc-float" style={{position:"relative",zIndex:2,width:320,background:"white",boxShadow:"0 20px 60px rgba(26,20,16,0.15)",padding:"2rem",transform:"rotate(-2deg)"}}>
            <div style={{position:"absolute",top:-15,right:-15,width:72,height:72,background:C.gold,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontFamily:"'Playfair Display',serif",fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.05em",textAlign:"center",lineHeight:1.3,textTransform:"uppercase",transform:"rotate(15deg)",boxShadow:"0 4px 12px rgba(184,150,106,0.4)"}}>Conforme<br/>RGPD<br/>2024</div>
            <div style={{borderBottom:`2px solid ${C.ink}`,paddingBottom:"1rem",marginBottom:"1.5rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.2rem"}}>Conditions Générales de Vente</div>
              <div style={{fontSize:"0.7rem",color:C.inkLight,fontStyle:"italic"}}>MonShop SAS · En vigueur au 23/02/2026</div>
            </div>
            {["Art. 1 — Champ d'application","Art. 2 — Prix & commandes","Art. 3 — Livraison & retours","Art. 4 — Données personnelles"].map((title,i)=>(
              <div key={i} style={{marginBottom:"1rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem"}}>{title}</div>
                <div style={{height:7,background:"rgba(26,20,16,0.07)",borderRadius:2,marginBottom:"0.3rem"}}/>
                <div style={{height:7,background:"rgba(26,20,16,0.07)",borderRadius:2,width:"80%"}}/>
              </div>
            ))}
            <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"#e8f5e9",color:"#2e7d32",fontSize:"0.6rem",padding:"0.3rem 0.7rem",borderRadius:20,marginTop:"0.5rem",fontFamily:"sans-serif",fontWeight:600}}>✓ Personnalisé & conforme</div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{background:C.ink,color:C.cream,padding:"1rem 4rem",display:"flex",justifyContent:"center",gap:"4rem"}}>
        {[["🔒","Paiement sécurisé Stripe"],["⚡","Document livré en 30 secondes"],["🌍","6 langues européennes"],["✦","Conforme directive 2011/83/UE"]].map(([icon,text])=>(
          <div key={text} style={{display:"flex",alignItems:"center",gap:"0.6rem",fontSize:"0.82rem",letterSpacing:"0.08em",opacity:0.8}}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      {/* PROBLEM */}
      <section style={{background:C.creamDark,borderTop:`1px solid rgba(26,20,16,0.1)`,borderBottom:`1px solid rgba(26,20,16,0.1)`,padding:"7rem 4rem"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6rem",alignItems:"center"}}>
          <div>
            <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem"}}>Le problème<span style={{width:40,height:1,background:C.gold,display:"block"}}/></div>
            <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:"2rem"}}>Ce que les e-commerçants <em style={{fontStyle:"italic",color:C.gold}}>évitent</em> jusqu'au dernier moment</h2>
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              {[
                ["😰","Avocat trop cher","Un juriste facture entre 300 € et 800 € pour rédiger vos CGV. Hors de portée pour une micro-entreprise."],
                ["📋","Templates inutilisables","Les modèles gratuits sont génériques, non conformes à votre activité et potentiellement obsolètes."],
                ["⚖️","Risque juridique réel","Des CGV absentes ou non conformes exposent à des amendes DGCCRF pouvant atteindre 15 000 €."],
              ].map(([icon,title,desc])=>(
                <div key={title} className="pain-item reveal d2" style={{display:"flex",gap:"1rem",alignItems:"flex-start",padding:"1.25rem",background:"white",border:`1px solid rgba(26,20,16,0.08)`}}>
                  <span style={{fontSize:"1.4rem",flexShrink:0}}>{icon}</span>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1rem",marginBottom:"0.25rem"}}>{title}</div>
                    <div style={{fontSize:"0.9rem",color:C.inkLight}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal" style={{padding:"3rem",border:`2px solid ${C.ink}`,position:"relative"}}>
            <span style={{position:"absolute",top:"-1.5rem",left:"2rem",fontFamily:"'Playfair Display',serif",fontSize:"6rem",color:C.gold,lineHeight:1,background:C.creamDark,padding:"0 0.5rem"}}>"</span>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontStyle:"italic",lineHeight:1.6,marginBottom:"2rem",color:C.ink}}>"J'ai lancé ma boutique Shopify sans CGV pendant 8 mois. Un client m'a menacé d'une plainte. Ça m'aurait coûté une fortune si j'avais attendu encore."</p>
            <div style={{fontSize:"0.85rem",color:C.inkLight}}>
              <strong style={{color:C.ink,display:"block",marginBottom:"0.2rem",fontFamily:"'Playfair Display',serif"}}>Marie-Claire D.</strong>
              Auto-entrepreneuse, boutique de cosmétiques naturels
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment" style={{padding:"7rem 4rem"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"5rem"}}>
            <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"1.5rem"}}>Comment ça marche<span style={{width:40,height:1,background:C.gold,display:"block"}}/></div>
            <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3.5rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em"}}>Trois étapes, <em style={{fontStyle:"italic",color:C.gold}}>c'est tout.</em></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,position:"relative"}}>
            <div style={{position:"absolute",top:"2.5rem",left:"calc(16.66% + 1rem)",right:"calc(16.66% + 1rem)",height:1,backgroundImage:`repeating-linear-gradient(90deg,${C.gold} 0,${C.gold} 6px,transparent 6px,transparent 14px)`}}/>
            {[["1","Remplissez le formulaire","15 questions sur votre activité, vos produits, votre politique de livraison et retours. Moins de 3 minutes."],
              ["2","Payez 9 €","Paiement sécurisé par carte via Stripe. Un paiement unique, aucun abonnement caché."],
              ["3","Téléchargez votre document","Vos CGV personnalisées générées instantanément. Copiez sur votre site ou téléchargez en PDF."]
            ].map(([num,title,desc],i)=>(
              <div key={i} className={`step reveal d${i}`} style={{padding:"0 2rem",textAlign:"center"}}>
                <div className="step-num" style={{width:"5rem",height:"5rem",background:C.ink,color:C.cream,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",fontWeight:700,margin:"0 auto 2rem",position:"relative",zIndex:2}}>{num}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,marginBottom:"0.75rem"}}>{title}</div>
                <div style={{fontSize:"0.92rem",color:C.inkLight,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{background:C.creamDark,borderTop:`1px solid rgba(26,20,16,0.1)`,borderBottom:`1px solid rgba(26,20,16,0.1)`,padding:"7rem 4rem"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"4rem"}}>
            <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"1.5rem"}}>Témoignages<span style={{width:40,height:1,background:C.gold,display:"block"}}/></div>
            <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em"}}>Ce qu'en disent <em style={{fontStyle:"italic",color:C.gold}}>nos clients</em></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2rem"}}>
            {[
              ["★★★★★","Impeccable. J'ai rempli le formulaire en 4 minutes, les CGV étaient prêtes immédiatement. Bien mieux que ce que j'avais trouvé gratuitement.","Thomas B.","Fondateur, SaaS B2B · Paris"],
              ["★★★★★","Enfin un outil sérieux pour les indépendants. Les CGV sont rédigées en français juridique propre, ça inspire confiance à mes clients.","Sophie L.","Créatrice, boutique mode · Lyon"],
              ["★★★★☆","J'avais peur que ce soit un simple template. Mais les CGV sont vraiment adaptées à mon activité de formation. Pour 9 €, c'est imbattable.","Julien M.","Formateur indépendant · Bordeaux"],
            ].map(([stars,text,name,role],i)=>(
              <div key={i} className={`testi-card reveal d${i}`} style={{background:"white",padding:"2rem",border:`1px solid rgba(26,20,16,0.08)`}}>
                <div style={{color:C.gold,fontSize:"0.9rem",marginBottom:"1rem",letterSpacing:"0.1em"}}>{stars}</div>
                <p style={{fontStyle:"italic",fontSize:"0.95rem",lineHeight:1.7,color:C.ink,marginBottom:"1.5rem"}}>&ldquo;{text}&rdquo;</p>
                <div style={{fontSize:"0.85rem"}}>
                  <strong style={{display:"block",color:C.ink,fontFamily:"'Playfair Display',serif",marginBottom:"0.2rem"}}>{name}</strong>
                  <span style={{color:C.inkLight,fontSize:"0.8rem"}}>{role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarif" style={{background:C.ink,color:C.cream,padding:"7rem 4rem"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4rem",alignItems:"center"}}>
          <div>
            <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.goldLight,display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem"}}>Tarif<span style={{width:40,height:1,background:C.goldLight,display:"block"}}/></div>
            <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3.5rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:"1.5rem"}}>Simple,<br/><em style={{fontStyle:"italic",color:C.goldLight}}>transparent.</em></h2>
            <p className="reveal d2" style={{color:"rgba(245,240,232,0.6)",fontSize:"1rem",lineHeight:1.8}}>Pas d'abonnement. Pas de frais cachés. Vous payez une fois, vous recevez vos CGV immédiatement. Insatisfait ? On vous rembourse.</p>
          </div>
          <div className="reveal" style={{border:`1px solid rgba(245,240,232,0.15)`,padding:"3rem",background:"rgba(245,240,232,0.04)"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"0.5rem",marginBottom:"0.5rem"}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:C.goldLight,alignSelf:"flex-start",marginTop:"0.75rem"}}>€</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"5rem",fontWeight:900,lineHeight:1,color:C.goldLight}}>9</span>
            </div>
            <div style={{fontSize:"0.85rem",color:"rgba(245,240,232,0.5)",marginBottom:"2rem"}}>Paiement unique · Sans abonnement</div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:"0.9rem",marginBottom:"2.5rem"}}>
              {["CGV complètes en 8+ articles","Personnalisées à votre activité","Conformes directive 2011/83/UE & RGPD","Disponibles en 6 langues","Livraison instantanée","Satisfait ou remboursé"].map(f=>(
                <li key={f} style={{display:"flex",alignItems:"flex-start",gap:"0.75rem",fontSize:"0.95rem",color:"rgba(245,240,232,0.85)"}}>
                  <span style={{color:C.goldLight,fontSize:"0.7rem",marginTop:"0.3rem",flexShrink:0}}>✦</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={onStart} style={{width:"100%",padding:"1rem",background:C.goldLight,color:C.ink,border:"none",cursor:"pointer",fontFamily:"'EB Garamond',serif",fontSize:"1rem",letterSpacing:"0.08em",fontWeight:500,transition:"background 0.2s"}}
              onMouseOver={e=>e.target.style.background="white"} onMouseOut={e=>e.target.style.background=C.goldLight}>
              Générer mes CGV maintenant
            </button>
            <div style={{marginTop:"1.5rem",fontSize:"0.8rem",color:"rgba(245,240,232,0.35)",textAlign:"center"}}>🔒 Paiement sécurisé · Remboursé si insatisfait</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"7rem 4rem"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"4rem"}}>
            <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"1.5rem"}}>FAQ<span style={{width:40,height:1,background:C.gold,display:"block"}}/></div>
            <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em"}}>Tout ce que vous <em style={{fontStyle:"italic",color:C.gold}}>devez savoir</em></h2>
          </div>
          {faqs.map(([q,a],i)=>(
            <div key={i} className={`faq-item reveal ${faqOpen===i?"faq-open":""}`} style={{borderBottom:`1px solid rgba(26,20,16,0.12)`,padding:"1.75rem 0",cursor:"pointer"}} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:500}}>
                {q}
                <span className="faq-icon" style={{fontSize:"1.5rem",color:C.gold,flexShrink:0,marginLeft:"1rem"}}>+</span>
              </div>
              <div className="faq-a" style={{fontSize:"0.95rem",color:C.inkLight,lineHeight:1.8}}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{background:C.creamDark,borderTop:`1px solid rgba(26,20,16,0.1)`,padding:"7rem 4rem",textAlign:"center"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div className="reveal" style={{fontSize:"0.75rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"1.5rem"}}>Prêt ?<span style={{width:40,height:1,background:C.gold,display:"block"}}/></div>
          <h2 className="reveal d1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3vw,3.5rem)",fontWeight:700,lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:"1.5rem"}}>Protégez votre activité <em style={{fontStyle:"italic",color:C.gold}}>aujourd'hui.</em></h2>
          <p className="reveal d2" style={{fontSize:"1.1rem",color:C.inkLight,marginBottom:"3rem"}}>Rejoignez plus de 2 400 e-commerçants qui ont sécurisé leur boutique. 5 minutes et 9 € — c'est tout ce qu'il faut.</p>
          <button onClick={onStart} className="btn-primary reveal d3" style={{fontSize:"1.1rem",padding:"1.1rem 3rem"}}>Générer mes CGV — 9 € →</button>
          <div className="reveal" style={{marginTop:"1.5rem",fontSize:"0.82rem",color:C.inkLight}}>Paiement sécurisé · Livraison instantanée · Satisfait ou remboursé</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:C.ink,color:"rgba(245,240,232,0.5)",padding:"3rem 4rem",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.82rem",flexWrap:"wrap",gap:"1rem"}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:900,color:C.cream}}>Lex<span style={{color:C.goldLight}}>Gen</span></span>
        <span>© 2026 LexGen. Tous droits réservés.</span>
        <div style={{display:"flex",gap:"2rem"}}>
          {["Mentions légales","Confidentialité","Contact"].map(l=>(
            <a key={l} href="#" style={{color:"rgba(245,240,232,0.4)",textDecoration:"none"}}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAYMENT FORM
// ─────────────────────────────────────────────
function PaymentForm({ onSuccess, onCancel, formData }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvc, setCvc]               = useState("");
  const [cardError, setCardError]   = useState("");
  const [processing, setProcessing] = useState(false);

  const fmtCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = v => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>=3?d.slice(0,2)+" / "+d.slice(2):d; };
  const isValid = cardNumber.replace(/\s/g,"").length===16 && expiry.replace(/\D/g,"").length===4 && cvc.length>=3;

  const handlePay = async () => {
    setCardError(""); setProcessing(true);
    const num=cardNumber.replace(/\s/g,""), exp=expiry.replace(/\D/g,"");
    const month=parseInt(exp.slice(0,2)), year=parseInt("20"+exp.slice(2,4)), now=new Date();
    if (num==="4000000000000002") { setTimeout(()=>{setCardError("Votre carte a été refusée.");setProcessing(false);},1200); return; }
    if (month<1||month>12) { setTimeout(()=>{setCardError("Date d'expiration invalide.");setProcessing(false);},600); return; }
    if (year<now.getFullYear()||(year===now.getFullYear()&&month<now.getMonth()+1)) { setTimeout(()=>{setCardError("Votre carte est expirée.");setProcessing(false);},600); return; }
    setTimeout(()=>{setProcessing(false);onSuccess();},1500);
  };

  const inp = (extra={}) => ({width:"100%",padding:"0.85rem 1rem",background:"#0a0a0f",border:"1px solid #2a2a3a",borderRadius:8,color:"#e8e4dc",fontSize:"1rem",fontFamily:"'EB Garamond',Georgia,serif",outline:"none",boxSizing:"border-box",...extra});

  return (
    <div style={{minHeight:"100vh",background:C.dark,color:"#e8e4dc",fontFamily:"'EB Garamond',Georgia,serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",position:"fixed",inset:0,overflowY:"auto",zIndex:999}}>
      <div style={{width:"100%",maxWidth:480}}>
        <button onClick={onCancel} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontFamily:"inherit",fontSize:"0.9rem",marginBottom:"2rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>← Retour à l'accueil</button>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>🔒</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",fontWeight:700,margin:"0 0 0.5rem"}}>Paiement sécurisé</h2>
          <p style={{color:"#888",margin:0,fontSize:"0.9rem"}}>Vos CGV personnalisées en quelques secondes</p>
        </div>
        <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:12,padding:"1.5rem",marginBottom:"1.5rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",paddingBottom:"1rem",borderBottom:"1px solid #2a2a3a"}}>
            <div>
              <div style={{fontWeight:700,marginBottom:"0.25rem",fontFamily:"'Playfair Display',serif"}}>Génération CGV complètes</div>
              <div style={{fontSize:"0.8rem",color:"#888"}}>{formData.companyName||"Votre entreprise"} · {formData.outputLanguage||"Français"}</div>
            </div>
            <div style={{fontSize:"1.5rem",fontWeight:700,color:C.goldLight}}>9,00 €</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem 1.5rem",fontSize:"0.8rem",color:"#666"}}>
            <span>✓ Document complet (8+ articles)</span><span>✓ Conforme RGPD</span><span>✓ Livraison instantanée</span>
          </div>
        </div>
        <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:12,padding:"1.5rem",marginBottom:"1rem"}}>
          <div style={{fontSize:"0.78rem",color:C.goldLight,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"1.25rem"}}>Informations de carte</div>
          <div style={{marginBottom:"1rem"}}>
            <div style={{fontSize:"0.75rem",color:"#666",marginBottom:"0.4rem"}}>Numéro de carte</div>
            <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e=>setCardNumber(fmtCard(e.target.value))} style={inp()} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
            <div>
              <div style={{fontSize:"0.75rem",color:"#666",marginBottom:"0.4rem"}}>Date d'expiration</div>
              <input type="text" inputMode="numeric" placeholder="MM / AA" value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} style={inp()} />
            </div>
            <div>
              <div style={{fontSize:"0.75rem",color:"#666",marginBottom:"0.4rem"}}>CVC</div>
              <input type="text" inputMode="numeric" placeholder="123" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} style={inp()} />
            </div>
          </div>
          {cardError && <div style={{color:"#e05555",fontSize:"0.85rem",marginTop:"1rem"}}>⚠ {cardError}</div>}
        </div>
        <button onClick={handlePay} disabled={processing||!isValid} style={{width:"100%",padding:"1rem",background:processing?"#2a2a3a":isValid?"linear-gradient(135deg,#c8b89a,#e8d4b0)":"#1e1e2e",color:processing||!isValid?"#555":"#0a0a0f",border:"none",borderRadius:10,cursor:processing||!isValid?"default":"pointer",fontFamily:"inherit",fontSize:"1rem",fontWeight:700,marginBottom:"1rem",transition:"all 0.2s"}}>
          {processing?"⏳ Traitement en cours...":"💳 Payer 9,00 € et générer mes CGV"}
        </button>
        <div style={{display:"flex",justifyContent:"center",gap:"1.5rem",marginTop:"1rem",fontSize:"0.75rem",color:"#444"}}>
          <span>🔒 SSL sécurisé</span><span>⚡ Stripe</span><span>🛡 Données protégées</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CGV GENERATOR (formulaire)
// ─────────────────────────────────────────────
function Generator({ onBackHome }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData]       = useState({});
  const [selectedMulti, setSelectedMulti] = useState({});
  const [screen, setScreen]           = useState("form");
  const [result, setResult]           = useState(null);
  const [copied, setCopied]           = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const step     = STEPS[currentStep];
  const progress = (currentStep / STEPS.length) * 100;

  const validateSiret = s => {
    const n = s.replace(/[\s.]/g,"");
    if (!n) return "Le numéro SIRET est requis.";
    if (!/^\d+$/.test(n)) return "Le SIRET ne doit contenir que des chiffres.";
    if (n.length!==14) return "Le SIRET doit contenir 14 chiffres (vous en avez saisi "+n.length+").";
    return null;
  };
  const validateAddress = a => {
    if (!a||a.trim().length<10) return "Adresse trop courte.";
    if (!/\d/.test(a)) return "L'adresse doit contenir un numéro de rue.";
    if (!/\d{5}/.test(a.replace(/\s/g,""))) return "L'adresse doit contenir un code postal (5 chiffres).";
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

  const generateCGV = async () => {
    setScreen("generating");
    const date = new Date().toLocaleDateString("fr-FR");
    try {
      const prompt = `Tu es un expert juridique. Génère des CGV professionnelles complètes en ${formData.outputLanguage||"Français"} pour : Entreprise: ${formData.companyName} (${formData.legalForm}, SIRET ${formData.siret}), Adresse: ${formData.address}, Email: ${formData.email}, Produits: ${formData.productType} – ${formData.productDescription}, Pays: ${formData.countries}, Devise: ${formData.currency}, Livraison: ${formData.deliveryDelay} frais ${formData.shippingCost}, Retours: ${formData.returnPolicy} frais ${formData.returnCost}, Paiement: ${formData.paymentMethods} via ${formData.paymentProcessor}, Données: ${formData.dataProcessor}${formData.additionalClauses?`, Clauses supp: ${formData.additionalClauses}`:""}.
CGV complètes articles numérotés conformes directive 2011/83/UE et RGPD. Inclure: champ application, prix, commandes, paiement, livraison, rétractation, garanties, responsabilité, données personnelles, droit applicable. Terminer par "Document généré le ${date} – À titre informatif."`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      setResult(data.content?.map(b=>b.text||"").join("\n")||buildFallback(date));
    } catch { setResult(buildFallback(date)); }
    setScreen("result");
  };

  const copy  = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const reset = () => { setCurrentStep(0);setFormData({});setSelectedMulti({});setResult(null);setScreen("form"); };

  const inp = (val,err) => ({width:"100%",padding:"0.9rem 1rem",background:"#13131a",border:`1px solid ${err?"#e05555":val?"#c8b89a44":"#2a2a3a"}`,borderRadius:8,color:"#e8e4dc",fontSize:"0.95rem",fontFamily:"'EB Garamond',Georgia,serif",outline:"none",boxSizing:"border-box"});

  if (screen==="payment") return <PaymentForm formData={formData} onSuccess={generateCGV} onCancel={()=>setScreen("form")} />;

  if (screen==="generating") return (
    <div style={{minHeight:"100vh",background:C.dark,color:"#e8e4dc",fontFamily:"'EB Garamond',Georgia,serif",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"2rem",position:"fixed",inset:0,zIndex:999}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{fontSize:"3rem",animation:"spin 2s linear infinite"}}>⚙️</div>
      <div style={{textAlign:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",marginBottom:"0.5rem"}}>Paiement confirmé ✓</h2>
        <p style={{color:"#888",fontSize:"0.9rem"}}>Rédaction de vos CGV personnalisées...</p>
      </div>
    </div>
  );

  if (screen==="result"&&result) return (
    <div style={{minHeight:"100vh",background:C.dark,color:"#e8e4dc",fontFamily:"'EB Garamond',Georgia,serif",padding:"2rem",position:"fixed",inset:0,overflowY:"auto",zIndex:999}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
          <div>
            <div style={{color:C.goldLight,fontSize:"0.8rem",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"0.5rem"}}>Paiement confirmé · Document généré ✓</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:700,margin:0}}>Vos CGV sont prêtes</h1>
          </div>
          <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
            <button onClick={copy} style={{padding:"0.75rem 1.5rem",background:copied?"#2d5a27":C.goldLight,color:copied?"#e8e4dc":C.ink,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
              {copied?"✓ Copié !":"Copier le texte"}
            </button>
            <button onClick={reset} style={{padding:"0.75rem 1.5rem",background:"transparent",color:C.goldLight,border:`1px solid ${C.goldLight}`,borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>Nouvelle génération</button>
            <button onClick={onBackHome} style={{padding:"0.75rem 1.5rem",background:"transparent",color:"#555",border:"1px solid #333",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>← Accueil</button>
          </div>
        </div>
        <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:12,padding:"2.5rem",lineHeight:1.8,fontSize:"0.92rem",maxHeight:"70vh",overflow:"auto"}}>
          {result.split('\n').map((line,i)=>{
            if(line.startsWith('# ')) return <h1 key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:C.goldLight,borderBottom:"1px solid #2a2a3a",paddingBottom:"0.5rem",marginBottom:"1.5rem"}}>{line.replace('# ','')}</h1>;
            if(line.startsWith('## ')) return <h2 key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#e8e4dc",marginTop:"2rem",marginBottom:"0.5rem",fontWeight:700}}>{line.replace('## ','')}</h2>;
            if(line==='---') return <hr key={i} style={{border:"none",borderTop:"1px solid #2a2a3a",margin:"1.5rem 0"}}/>;
            return <p key={i} style={{margin:line?"0 0 0.5rem":"0.5rem 0",color:line.startsWith('*')?"#888":"#c8c4bc"}} dangerouslySetInnerHTML={{__html:line.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#e8e4dc">$1</strong>')}}/>;
          })}
        </div>
        <div style={{marginTop:"1.5rem",padding:"1rem 1.5rem",background:"#1a1208",border:"1px solid #3a2a08",borderRadius:8,fontSize:"0.82rem",color:"#a08050"}}>
          ⚠️ Ce document est généré à titre informatif et ne remplace pas un conseil juridique professionnel.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.dark,color:"#e8e4dc",fontFamily:"'EB Garamond',Georgia,serif",position:"fixed",inset:0,overflowY:"auto",zIndex:999}}>
      <div style={{borderBottom:"1px solid #1e1e2e",padding:"1.25rem 2rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={onBackHome} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:900,color:"#e8e4dc",letterSpacing:"-0.02em"}}>
          Lex<span style={{color:C.goldLight}}>Gen</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <span style={{fontSize:"0.85rem",color:"#666"}}>Étape {currentStep+1} / {STEPS.length}</span>
          <span style={{padding:"0.35rem 0.9rem",background:"#13131a",border:"1px solid #2a2a3a",borderRadius:20,fontSize:"0.8rem",color:C.goldLight,fontWeight:700}}>9 €</span>
        </div>
      </div>
      <div style={{height:3,background:"#1e1e2e"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#c8b89a,#e8d4b0)",width:`${progress}%`,transition:"width 0.4s ease"}}/>
      </div>
      <div style={{maxWidth:640,margin:"0 auto",padding:"3rem 2rem"}}>
        <div style={{marginBottom:"2.5rem"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>{step.icon}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",fontWeight:700,margin:0}}>{step.title}</h2>
          <div style={{display:"flex",gap:"0.4rem",marginTop:"1rem"}}>
            {STEPS.map((_,i)=><div key={i} style={{height:4,flex:1,borderRadius:2,background:i<=currentStep?C.goldLight:"#1e1e2e",transition:"background 0.3s"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
          {step.fields.map(field=>(
            <div key={field.key}>
              <label style={{display:"block",fontSize:"0.85rem",color:C.goldLight,letterSpacing:"0.08em",marginBottom:"0.6rem",textTransform:"uppercase"}}>{field.label}</label>
              {field.type==="text"||field.type==="email" ? (
                <><input type={field.type} placeholder={field.placeholder} value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} onBlur={e=>handleBlur(field.key,e.target.value)} style={inp(formData[field.key],fieldErrors[field.key])}/>
                {fieldErrors[field.key]&&<div style={{color:"#e05555",fontSize:"0.8rem",marginTop:"0.4rem"}}>⚠ {fieldErrors[field.key]}</div>}</>
              ):field.type==="textarea"?(
                <textarea placeholder={field.placeholder} value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} rows={3} style={{...inp(formData[field.key]),resize:"vertical"}}/>
              ):field.type==="select"?(
                <select value={formData[field.key]||""} onChange={e=>handleField(field.key,e.target.value)} style={{...inp(formData[field.key]),color:formData[field.key]?"#e8e4dc":"#555",cursor:"pointer"}}>
                  <option value="">Sélectionner...</option>
                  {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ):field.type==="multiselect"?(
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                  {field.options.map(o=>{const sel=(selectedMulti[field.key]||[]).includes(o);return<button key={o} onClick={()=>handleMulti(field.key,o)} style={{padding:"0.5rem 1rem",background:sel?"#c8b89a22":"transparent",border:`1px solid ${sel?C.goldLight:"#2a2a3a"}`,borderRadius:20,color:sel?C.goldLight:"#666",fontSize:"0.85rem",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{sel?"✓ ":""}{o}</button>;})}
                </div>
              ):null}
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"3rem"}}>
          <button onClick={()=>setCurrentStep(s=>s-1)} disabled={currentStep===0} style={{padding:"0.9rem 1.8rem",background:"transparent",border:"1px solid #2a2a3a",borderRadius:8,color:currentStep===0?"#333":"#888",cursor:currentStep===0?"default":"pointer",fontFamily:"inherit",fontSize:"0.95rem"}}>← Précédent</button>
          {currentStep<STEPS.length-1?(
            <button onClick={()=>setCurrentStep(s=>s+1)} disabled={!isStepValid()} style={{padding:"0.9rem 2rem",background:isStepValid()?C.goldLight:"#1e1e2e",color:isStepValid()?C.ink:"#333",border:"none",borderRadius:8,cursor:isStepValid()?"pointer":"default",fontFamily:"inherit",fontSize:"0.95rem",fontWeight:700,transition:"all 0.2s"}}>Suivant →</button>
          ):(
            <button onClick={()=>setScreen("payment")} disabled={!isStepValid()} style={{padding:"0.9rem 2rem",background:isStepValid()?"linear-gradient(135deg,#c8b89a,#e8d4b0)":"#1e1e2e",color:isStepValid()?C.ink:"#333",border:"none",borderRadius:8,cursor:isStepValid()?"pointer":"default",fontFamily:"inherit",fontSize:"0.95rem",fontWeight:700}}>💳 Payer 9 € et générer →</button>
          )}
        </div>
        {currentStep===STEPS.length-1&&(
          <div style={{marginTop:"1.5rem",display:"flex",justifyContent:"center",gap:"2rem",fontSize:"0.78rem",color:"#444"}}>
            <span>🔒 Paiement sécurisé Stripe</span><span>⚡ 30 secondes</span><span>✓ Satisfait ou remboursé</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT — navigation entre pages
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing"); // "landing" | "generator"

  if (page === "generator") return <Generator onBackHome={() => setPage("landing")} />;
  return <Landing onStart={() => setPage("generator")} />;
}
