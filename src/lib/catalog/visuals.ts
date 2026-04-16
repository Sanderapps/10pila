const CATEGORY_VISUALS: Record<
  string,
  {
    accent: string;
    accentSoft: string;
    glyph: string;
    label: string;
  }
> = {
  "Cabos e Adaptadores": {
    accent: "#3df5a5",
    accentSoft: "#69b7ff",
    glyph: "M340 500h170c34 0 34-54 68-54h104c34 0 34 54 68 54h180"
      + " M350 438v124 M930 438v124 M520 438v124 M748 438v124",
    label: "conexao rapida"
  },
  "Organização de Mesa": {
    accent: "#69b7ff",
    accentSoft: "#3df5a5",
    glyph: "M360 390h480v250H360z M430 450h150 M430 510h210 M430 570h170 M700 450h70v130h-70z",
    label: "mesa no jeito"
  },
  "Acessórios de Celular": {
    accent: "#55c8ff",
    accentSoft: "#7ef7cd",
    glyph: "M470 280h260c28 0 50 22 50 50v250c0 28-22 50-50 50H470c-28 0-50-22-50-50V330c0-28 22-50 50-50z"
      + " M560 328h80 M590 585h20",
    label: "mobile util"
  },
  "Iluminação Pequena": {
    accent: "#ffd166",
    accentSoft: "#69b7ff",
    glyph: "M600 320c78 0 140 62 140 140 0 52-28 98-70 122v48H530v-48c-42-24-70-70-70-122 0-78 62-140 140-140z"
      + " M600 240v38 M708 276l-26 28 M492 276l26 28",
    label: "luz no ponto"
  },
  "Utilidades USB": {
    accent: "#7ef7cd",
    accentSoft: "#55c8ff",
    glyph: "M520 330h160v84h78v152H442V414h78z M600 250v80 M560 290l40-40 40 40",
    label: "usb no bolso"
  },
  "Limpeza Tech": {
    accent: "#69b7ff",
    accentSoft: "#ffd166",
    glyph: "M430 570c120-20 220-20 340 0 M510 520l44-178h92l44 178"
      + " M600 342v-70 M560 272h80",
    label: "limpeza sem drama"
  },
  "Suporte e Fixação": {
    accent: "#55c8ff",
    accentSoft: "#3df5a5",
    glyph: "M410 590h380 M500 590V410c0-56 44-100 100-100s100 44 100 100v180"
      + " M600 410h120",
    label: "segura firme"
  },
  "Mini Ferramentas Tech": {
    accent: "#3df5a5",
    accentSoft: "#ffd166",
    glyph: "M465 560l78-78 48 48-78 78-84 24z M628 396l48-48 92 92-48 48z",
    label: "kit rapido"
  },
  "Itens Curiosos de Setup": {
    accent: "#7ef7cd",
    accentSoft: "#ff4f9a",
    glyph: "M420 560h360v-42c0-48-38-86-86-86h-188c-48 0-86 38-86 86z M500 432V352h200v80",
    label: "achado curioso"
  },
  "Acessórios de Notebook": {
    accent: "#69b7ff",
    accentSoft: "#55c8ff",
    glyph: "M400 390h400v210H400z M350 630h500",
    label: "notebook no eixo"
  },
  "Viagem e Escritório": {
    accent: "#55c8ff",
    accentSoft: "#ffd166",
    glyph: "M430 380h340v220H430z M500 330h200 M520 450h160 M520 520h120",
    label: "leva facil"
  },
  "Carro e Viagem": {
    accent: "#3df5a5",
    accentSoft: "#69b7ff",
    glyph: "M420 540l36-118h288l36 118 M470 540a42 42 0 1 0 0 84 42 42 0 0 0 0-84z M730 540a42 42 0 1 0 0 84 42 42 0 0 0 0-84z",
    label: "rolando junto"
  },
  Teste: {
    accent: "#ff5c7a",
    accentSoft: "#ffd166",
    glyph: "M600 330m-120 0a120 120 0 1 0 240 0a120 120 0 1 0 -240 0 M600 450v220",
    label: "checkout teste"
  }
};

export function categoryVisual(category?: string) {
  return (
    CATEGORY_VISUALS[category ?? ""] ?? {
      accent: "#3df5a5",
      accentSoft: "#69b7ff",
      glyph: "M420 390h360v220H420z M480 450h240 M480 520h170",
      label: "achado tech"
    }
  );
}

export function catalogPlaceholderDataUrl(name: string, category: string) {
  const visual = categoryVisual(category);
  const safeName = name.replace(/&/g, "&amp;");
  const safeCategory = category.replace(/&/g, "&amp;");
  const safeLabel = visual.label.replace(/&/g, "&amp;");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#05070b"/>
          <stop offset="50%" stop-color="#0f1722"/>
          <stop offset="100%" stop-color="#070a10"/>
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${visual.accent}"/>
          <stop offset="100%" stop-color="${visual.accentSoft}"/>
        </linearGradient>
        <radialGradient id="orb" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="${visual.accent}" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="${visual.accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <rect x="60" y="60" width="1080" height="780" rx="52" fill="rgba(255,255,255,0.03)" stroke="rgba(105,183,255,0.16)"/>
      <circle cx="230" cy="180" r="210" fill="url(#orb)"/>
      <circle cx="960" cy="180" r="230" fill="${visual.accentSoft}" fill-opacity="0.14"/>
      <circle cx="980" cy="750" r="240" fill="${visual.accent}" fill-opacity="0.12"/>
      <path d="M140 735C270 612 382 596 530 628s264 38 408-12 202-118 248-174" stroke="url(#beam)" stroke-width="18" stroke-linecap="round" opacity="0.42"/>
      <rect x="160" y="170" width="880" height="390" rx="38" fill="rgba(3,8,14,0.52)" stroke="rgba(255,255,255,0.07)"/>
      <path d="${visual.glyph}" fill="none" stroke="url(#beam)" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
      <rect x="170" y="610" width="280" height="30" rx="15" fill="url(#beam)" opacity="0.94"/>
      <rect x="170" y="664" width="440" height="18" rx="9" fill="rgba(255,255,255,0.14)"/>
      <text x="170" y="352" fill="#f7fbff" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700">${safeName}</text>
      <text x="170" y="424" fill="#a7b0bd" font-family="Arial, Helvetica, sans-serif" font-size="30">${safeCategory}</text>
      <text x="170" y="730" fill="${visual.accent}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">${safeLabel} • 10PILA</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}
