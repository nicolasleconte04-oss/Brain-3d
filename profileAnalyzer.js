/* ProfileAnalyzer + ProfileAnalyzerUI — social profile analysis module */

const ZONE_COLORS = {
  "Lobe frontal":           "#7B9EA8",
  "Lobe pariétal":          "#9BAEC8",
  "Lobe temporal":          "#B8A9C9",
  "Lobe occipital":         "#C4A882",
  "Cortex moteur":          "#A8C5A0",
  "Amygdale":               "#C0392B",
  "Hippocampe":             "#8FBC8F",
  "Système dopaminergique": "#D4860A",
};

const ProfileAnalyzer = {
  async analyze(rawText, source) {
    const prompt = `Tu es un expert en psychologie comportementale DISC. Analyse ce texte issu de ${source} et déduis le profil DISC de cette personne avec précision.

TEXTE À ANALYSER :
${rawText}

Retourne UNIQUEMENT un JSON valide (sans texte avant ou après, sans markdown) avec cette structure exacte :
{
  "disc": { "D": 0, "E": 0, "O": 0, "C": 0, "M": 0, "F": 0 },
  "profil_type": "string",
  "leviers": ["string", "string", "string"],
  "resistances": ["string", "string"],
  "style_communication": "string",
  "signaux_ouverture": ["string", "string"],
  "signaux_mefiance": ["string", "string"],
  "zones_cerebrales": ["string"],
  "zones_explications": { "zone": "explication" },
  "synthese": "string",
  "fiabilite": 0,
  "fiabilite_raison": "string"
}

Pour disc, chaque valeur est un entier entre 0 et 100. Pour zones_cerebrales, utilise uniquement : Lobe frontal, Lobe pariétal, Lobe temporal, Lobe occipital, Cortex moteur, Amygdale, Hippocampe, Système dopaminergique.`;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        system: 'Tu es un expert en psychologie comportementale DISC. Tu retournes uniquement du JSON valide, sans markdown, sans texte hors du JSON.',
      }),
    });

    if (!res.ok) throw new Error('Erreur API ' + res.status);
    const data = await res.json();

    const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse invalide — JSON non trouvé');
    return JSON.parse(jsonMatch[0]);
  },

  syncToBrainMap(zones, explications) {
    const payload = {
      activeZones: zones,
      explications: explications,
      source: 'meeting_profile_analysis',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('mybrain_active_zones', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('brainZonesUpdated', { detail: payload }));
  },
};

const ProfileAnalyzerUI = {
  _state: {
    source: 'LinkedIn',
    text: '',
    loading: false,
    result: null,
  },

  inject(containerId, { onInject } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const SOURCES = ['LinkedIn', 'Instagram', 'Twitter/X', 'Autre'];
    const s = this._state;

    const render = () => {
      const fiabiliteColor = s.result
        ? s.result.fiabilite >= 70 ? '#2D6A4F' : s.result.fiabilite >= 45 ? '#D4860A' : '#C0392B'
        : '#2D6A4F';

      container.innerHTML = `
        <div class="pa-wrap">
          <div class="bloc-label">SOURCE DU PROFIL</div>
          <div class="pa-pills">
            ${SOURCES.map(src => `
              <button class="pill ${s.source === src ? 'active' : ''}"
                onclick="ProfileAnalyzerUI._setSource('${src}')">
                ${src}
              </button>
            `).join('')}
          </div>

          <div class="bloc-label" style="margin-top:16px">TEXTE BRUT À ANALYSER</div>
          <div style="position:relative">
            <textarea id="pa-textarea" class="pa-textarea"
              placeholder="Colle ici la bio, les posts, la description LinkedIn, les tweets..."
              oninput="ProfileAnalyzerUI._setText(this.value)">${s.text}</textarea>
            <div class="pa-char-count">${s.text.length} car.</div>
          </div>

          <button class="pa-btn ${s.loading || !s.text.trim() ? 'disabled' : ''}"
            onclick="ProfileAnalyzerUI._analyze()"
            ${s.loading || !s.text.trim() ? 'disabled' : ''}>
            ${s.loading
              ? '<span class="pa-dots"><span></span><span></span><span></span></span>'
              : 'Analyser le profil'}
          </button>

          ${s.result ? `
            <div class="pa-results">
              <div class="pa-synthese">${s.result.synthese}</div>

              <div class="pa-info-row">
                <span class="bloc-label">TYPE DE PROFIL</span>
                <span class="pa-profil-type">${s.result.profil_type}</span>
              </div>

              <div class="bloc-label" style="margin-top:16px">PROFIL DISC</div>
              ${['D','E','O','C','M','F'].map(k => {
                const val = s.result.disc[k] ?? 50;
                const label = { D:'Dominance', E:'Expressivité', O:'Ouverture', C:'Rigueur', M:'Motivation', F:'Flexibilité' }[k];
                return `
                  <div class="pa-disc-row">
                    <div class="pa-disc-header">
                      <span class="pa-disc-label">${label}</span>
                      <span class="pa-disc-val">${val}</span>
                    </div>
                    <div class="pa-bar-track">
                      <div class="pa-bar-fill" style="width:0%" data-target="${val}"></div>
                    </div>
                  </div>
                `;
              }).join('')}

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div>
                  <div class="bloc-label">LEVIERS D'INFLUENCE</div>
                  <div class="pa-tags green">
                    ${(s.result.leviers || []).map(l => `<span class="pa-tag green">${l}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <div class="bloc-label">RÉSISTANCES</div>
                  <div class="pa-tags red">
                    ${(s.result.resistances || []).map(r => `<span class="pa-tag red">${r}</span>`).join('')}
                  </div>
                </div>
              </div>

              <div class="bloc-label" style="margin-top:16px">STYLE DE COMMUNICATION</div>
              <div class="pa-comm-style">${s.result.style_communication}</div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div>
                  <div class="bloc-label">SIGNAUX D'OUVERTURE</div>
                  ${(s.result.signaux_ouverture || []).map(sig => `<div class="pa-signal open">↗ ${sig}</div>`).join('')}
                </div>
                <div>
                  <div class="bloc-label">SIGNAUX DE MÉFIANCE</div>
                  ${(s.result.signaux_mefiance || []).map(sig => `<div class="pa-signal closed">↘ ${sig}</div>`).join('')}
                </div>
              </div>

              ${(s.result.zones_cerebrales || []).length ? `
                <div class="bloc-label" style="margin-top:16px">ZONES CÉRÉBRALES</div>
                ${(s.result.zones_cerebrales || []).map(z => {
                  const col = ZONE_COLORS[z] || '#A8C5A0';
                  const exp = s.result.zones_explications?.[z] || '';
                  return `
                    <div class="pa-zone-row">
                      <span class="pa-zone-dot" style="background:${col}"></span>
                      <div>
                        <span class="pa-zone-name" style="color:${col}">${z}</span>
                        ${exp ? `<em class="pa-zone-exp">${exp}</em>` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              ` : ''}

              <div class="bloc-label" style="margin-top:16px">SCORE DE FIABILITÉ</div>
              <div class="pa-fiab" style="color:${fiabiliteColor};border-color:${fiabiliteColor}">
                <span class="pa-fiab-val">${s.result.fiabilite}%</span>
                <span class="pa-fiab-reason">${s.result.fiabilite_raison}</span>
              </div>

              <button class="pa-inject-btn" onclick="ProfileAnalyzerUI._inject()">
                ↗ Injecter dans la réunion
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (s.result) {
        requestAnimationFrame(() => {
          container.querySelectorAll('.pa-bar-fill').forEach(el => {
            const target = el.getAttribute('data-target');
            requestAnimationFrame(() => { el.style.width = target + '%'; });
          });
        });
      }

      this._containerId = containerId;
      this._onInject    = onInject;
    };

    this._render  = render;
    this._onInject = onInject;
    this._containerId = containerId;
    render();
  },

  _setSource(src) {
    this._state.source = src;
    this._render();
  },

  _setText(val) {
    this._state.text = val;
    const count = document.querySelector('.pa-char-count');
    if (count) count.textContent = val.length + ' car.';
    const btn = document.querySelector('.pa-btn');
    if (btn) {
      btn.disabled = !val.trim();
      btn.classList.toggle('disabled', !val.trim());
    }
  },

  async _analyze() {
    if (!this._state.text.trim() || this._state.loading) return;
    this._state.loading = true;
    this._render();

    try {
      const result = await ProfileAnalyzer.analyze(this._state.text, this._state.source);
      this._state.result  = result;
      this._state.loading = false;
      this._render();
    } catch (err) {
      this._state.loading = false;
      this._render();
      const el = document.getElementById(this._containerId);
      if (el) {
        const errDiv = document.createElement('div');
        errDiv.className = 'pa-error';
        errDiv.textContent = 'Erreur : ' + err.message;
        el.querySelector('.pa-wrap').appendChild(errDiv);
      }
    }
  },

  _inject() {
    if (!this._state.result || !this._onInject) return;
    const { result } = this._state;
    this._onInject({
      disc:        result.disc,
      zones:       result.zones_cerebrales || [],
      explications:result.zones_explications || {},
      profil_type: result.profil_type,
    });
  },
};
