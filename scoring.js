/* ScoringEngine — DISC behavioral scoring shared module */
const ScoringEngine = {
  LIEU_S:   { "Son terrain": 30, "Terrain neutre": 50, "Mon terrain": 70, "En ligne": 45 },
  TIMING_S: { "Urgence forte": 25, "Timing normal": 50, "Temps ouvert": 75 },
  ENJEU_S:  { "Faible": 75, "Moyen": 50, "Élevé": 30, "Critique": 15 },
  RELAT_S:  { "Froide": 25, "Tiède": 50, "Chaude": 80 },
  MULT:     { "Négociation": 1.3, "Décision critique": 1.5, "Séduction": 1.1, "Networking": 1.0, "Autre": 1.0 },

  ctxScore(ctx) {
    return Math.round(
      (this.LIEU_S[ctx.lieu]     ?? 50) * 0.25 +
      (this.TIMING_S[ctx.timing] ?? 50) * 0.25 +
      (this.ENJEU_S[ctx.enjeu]   ?? 50) * 0.25 +
      (this.RELAT_S[ctx.relation]?? 50) * 0.25
    );
  },

  calcSC(me, other) {
    return Math.round(Math.min(100, Math.max(0,
      100 - (0.30 * Math.abs(me.D - other.D) +
             0.25 * Math.abs(me.E - other.E) +
             0.25 * Math.abs(me.O - other.O) +
             0.20 * Math.abs(me.C - other.C))
    )));
  },

  calcPD(other, cs) {
    return Math.round(Math.min(100, Math.max(0,
      0.35 * other.O + 0.25 * other.M + 0.20 * other.F +
      0.10 * (100 - other.E) + 0.10 * cs
    )));
  },

  calcSF(me, other, cs) {
    return Math.round(Math.min(100, Math.max(0,
      0.40 * Math.abs(me.D - other.D) +
      0.30 * other.E +
      0.20 * (100 - other.F) +
      0.10 * (100 - cs)
    )));
  },

  calcAll(me, other, ctx, objectif) {
    const cs   = this.ctxScore(ctx);
    const SC   = this.calcSC(me, other);
    const PD   = this.calcPD(other, cs);
    const SF   = this.calcSF(me, other, cs);
    const mult = this.MULT[objectif] ?? 1.0;
    const raw  = Math.round(0.40 * SC + 0.35 * PD + 0.25 * (100 - SF));
    const SGR  = Math.round(Math.min(100, raw / mult));
    const P_pos = Math.min(93, Math.round((PD / 100) * (SC / 100) * (1 - SF / 100) * 100));
    const P_neg = Math.min(93, Math.round((1 - PD / 100) * (SF / 100) * (other.D / 100) * 100));
    const P_neu = Math.max(5, 100 - P_pos - P_neg);
    return { SC, PD, SF, SGR, P_pos, P_neu, P_neg, cs, mult };
  },

  calcRelScore(history) {
    if (!history || !history.length) return 50;
    const weights = { positif: 80, neutre: 50, negatif: 20 };
    let sum = 0, total = 0;
    history.forEach((entry, i) => {
      const w = i + 1;
      sum   += (weights[entry.outcome] ?? 50) * w;
      total += w;
    });
    return Math.round(sum / total);
  },
};
