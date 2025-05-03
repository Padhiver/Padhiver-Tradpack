// Fichier : modules/padhiver-tradpack/scripts/main.js (ou le nom que vous avez défini dans module.json)

Hooks.on('i18nInit', async () => {
    // 1. Vérifier si la langue actuelle est le français
    if (game.settings.get('core', 'language') !== 'fr') {
      return; // Ne rien faire si la langue n'est pas le français
    }
  
    const MY_MODULE_ID = 'padhiver-tradpack'; // ID de votre module
    const translationFilePath = `modules/${MY_MODULE_ID}/fr.json`;
  
    console.log(`${MY_MODULE_ID} | Tentative de chargement des traductions FR personnalisées depuis ${translationFilePath}`);
  
    try {
      // 2. Charger votre fichier fr.json
      const response = await fetch(translationFilePath);
      if (!response.ok) {
        // Gérer le cas où le fichier n'existe pas ou n'est pas accessible
        throw new Error(`Impossible de charger le fichier ${translationFilePath}. Statut: ${response.status}`);
      }
      const customTranslations = await response.json();
  
      // Vérifier si les traductions ont bien été chargées et ne sont pas vides
      if (!customTranslations || Object.keys(customTranslations).length === 0) {
        console.warn(`${MY_MODULE_ID} | Le fichier de traduction personnalisé a été chargé mais est vide ou invalide.`);
        return;
      }
  
      // 3. Fusionner vos traductions dans l'objet global, en écrasant les clés existantes
      // L'option 'overwrite: true' est cruciale ici.
      // L'option 'inplace: true' modifie directement l'objet game.i18n.translations.
      foundry.utils.mergeObject(game.i18n.translations, customTranslations, {
        inplace: true,      // Modifie directement game.i18n.translations
        overwrite: true,    // Remplace les clés existantes par celles de customTranslations
        insertKeys: true,   // Ajoute les nouvelles clés si elles n'existent pas
        insertValues: true, // Ajoute les nouvelles valeurs si elles n'existent pas
        enforceTypes: false // Moins strict sur les types, peut être utile
      });
  
      console.log(`${MY_MODULE_ID} | Traductions FR personnalisées fusionnées avec succès (mode écrasement).`);
  
    } catch (error) {
      console.error(`${MY_MODULE_ID} | Erreur lors du chargement ou de la fusion des traductions FR personnalisées :`, error);
    }
  });
  
  // Optionnel : Ajouter un log pour confirmer l'initialisation de votre module
  Hooks.once('init', () => {
    console.log(`Padhiver Traduction Pack | Initialisation du module de traduction.`);
  });