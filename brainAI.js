/* BrainAI — shared AI client for My Brain */
const BrainAI = {
  _history: [],

  async call({ userMessage, systemPrompt }) {
    this._history.push({ role: 'user', content: userMessage });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this._history,
        system: systemPrompt || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur API (' + res.status + ')');
    }

    const data  = await res.json();
    const reply = data.reply || '';
    this._history.push({ role: 'assistant', content: reply });
    return reply;
  },

  reset() {
    this._history = [];
  },

  buildSystemPrompt(ctx) {
    const { myProfile: me, meeting, scores } = ctx;
    const s = scores || {};
    const o = meeting.other || {};

    return `Tu es l'assistant stratégique personnel de ${me.nom}. Tu analyses les dynamiques comportementales DISC et tu aides ${me.nom} à préparer et réussir ses interactions sociales et professionnelles. Tutoie-le toujours.

PROFIL DISC DE ${me.nom.toUpperCase()} :
D (Dominance): ${me.D}/100 | E (Expressivité): ${me.E}/100 | O (Ouverture): ${me.O}/100
C (Rigueur): ${me.C}/100 | M (Motivation): ${me.M}/100 | F (Flexibilité): ${me.F}/100
Forces: ${(me.forces || []).join(', ')}
Failles: ${(me.failles || []).join(', ')}

CONTEXTE DE LA RÉUNION :
Titre: ${meeting.titre || 'Non défini'}
Objectif: ${meeting.type || 'Non défini'}
Date: ${meeting.date || 'Non définie'} ${meeting.heure ? 'à ' + meeting.heure : ''}
Lieu: ${meeting.lieu || 'Non défini'} | Enjeu: ${meeting.enjeu || 'Non défini'}
Relation: ${meeting.relation || 'Non définie'} | Timing: ${meeting.timing || 'Non défini'}

PROFIL DISC DE L'INTERLOCUTEUR :
D: ${o.D ?? 50}/100 | E: ${o.E ?? 50}/100 | O: ${o.O ?? 50}/100
C: ${o.C ?? 50}/100 | M: ${o.M ?? 50}/100 | F: ${o.F ?? 50}/100

SCORES DISC CALCULÉS :
Compatibilité (SC): ${s.SC ?? 'N/A'}/100
Probabilité décision (PD): ${s.PD ?? 'N/A'}/100
Facteur friction (SF): ${s.SF ?? 'N/A'}/100
Score global réunion (SGR): ${s.SGR ?? 'N/A'}/100
Probabilités: Positif ${s.P_pos ?? 'N/A'}% | Neutre ${s.P_neu ?? 'N/A'}% | Négatif ${s.P_neg ?? 'N/A'}%

NOTES DE RÉUNION :
${meeting.notes || 'Aucune note pour le moment.'}

INSTRUCTIONS :
- Analyse les dynamiques comportementales DISC spécifiques à cette interaction
- Identifie les leviers d'influence et les zones de résistance
- Propose des actions concrètes, mesurables et immédiatement actionnables
- Référence les zones cérébrales pertinentes quand c'est utile (Lobe frontal, Amygdale, etc.)
- Sois direct, stratégique, précis — pas de généralités
- Tutoie ${me.nom}`;
  },

  PROMPTS: {
    tone: "Analyse le ton et les dynamiques comportementales de cette interaction. Identifie les signaux clés, les tensions sous-jacentes et les leviers émotionnels activés.",
    nextSteps: "Donne-moi exactement 5 actions prioritaires pour maximiser les chances de succès de cette interaction. Format pour chaque action : [PRIORITÉ HAUTE/MOYENNE/BASSE] Action concrète — Responsable — Délai",
    decision: "Propose 3 décisions stratégiques pour cette interaction avec une argumentation DISC précise pour chacune. Explique pourquoi c'est le bon choix selon les profils et les scores calculés.",
    zones: 'Analyse les zones cérébrales qui seraient activées dans cette interaction DISC selon les profils. Retourne UNIQUEMENT un JSON valide sans texte avant ou après, avec exactement ce format : {"zones": ["Lobe frontal", "Amygdale"], "explications": {"Lobe frontal": "explication courte et précise", "Amygdale": "explication courte et précise"}}. Zones disponibles : Lobe frontal, Lobe pariétal, Lobe temporal, Lobe occipital, Cortex moteur, Amygdale, Hippocampe, Système dopaminergique.',
    resume: "Génère un compte-rendu structuré de cette réunion avec les sections suivantes : **Contexte** | **Points clés échangés** | **Dynamiques comportementales observées** | **Décisions prises ou à prendre** | **Prochaines étapes** | **Score global et analyse**",
  },
};
