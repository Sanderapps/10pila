import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils/slug";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  description: string;
  priceCents: number;
  promotionalCents: number | null;
  stock: number;
  category: string;
  specifications: Record<string, string>;
  featured: boolean;
};

function imagePlaceholder(name: string, category: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#06080b"/>
          <stop offset="100%" stop-color="#111823"/>
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="100%" stop-color="#69b7ff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="215" cy="150" r="180" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="980" cy="120" r="220" fill="#69b7ff" fill-opacity="0.14"/>
      <circle cx="990" cy="760" r="210" fill="${accent}" fill-opacity="0.12"/>
      <rect x="120" y="180" width="960" height="540" rx="44" fill="rgba(255,255,255,0.04)" stroke="rgba(105,183,255,0.16)" />
      <rect x="170" y="250" width="860" height="280" rx="30" fill="rgba(255,255,255,0.03)" stroke="rgba(61,245,165,0.18)" />
      <rect x="170" y="570" width="280" height="28" rx="14" fill="url(#glow)" fill-opacity="0.88"/>
      <rect x="170" y="620" width="520" height="18" rx="9" fill="rgba(255,255,255,0.14)"/>
      <text x="170" y="360" fill="#f5f7fb" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${name}</text>
      <text x="170" y="430" fill="#9fb1c7" font-family="Arial, Helvetica, sans-serif" font-size="28">${category}</text>
      <text x="170" y="680" fill="#3df5a5" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">achado tech 10PILA</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

const rawProducts: SeedProduct[] = [
  {
    name: "Organizador Magnet Clip",
    description: "Segura cabo na mesa sem drama e evita fio escapando toda hora.",
    priceCents: 1290,
    promotionalCents: 990,
    stock: 86,
    category: "Cabos e Adaptadores",
    specifications: { uso: "mesa", material: "silicone", fixacao: "adesiva" },
    featured: true
  },
  {
    name: "Protetor Espiral de Cabo",
    description: "Espiral flexível para salvar cabo de carregador no ponto mais sofrido.",
    priceCents: 890,
    promotionalCents: null,
    stock: 120,
    category: "Cabos e Adaptadores",
    specifications: { uso: "carregadores", material: "PVC", pacote: "kit com 4" },
    featured: false
  },
  {
    name: "Adaptador USB-C Pocket",
    description: "Transforma porta USB-C em USB-A sem ocupar espaço na mochila.",
    priceCents: 1490,
    promotionalCents: 1190,
    stock: 72,
    category: "Cabos e Adaptadores",
    specifications: { conexao: "USB-C para USB-A", uso: "celular e notebook", porte: "compacto" },
    featured: true
  },
  {
    name: "Adaptador OTG Mini",
    description: "Puxa pendrive pro celular sem gambiarra nem cabo gigante.",
    priceCents: 1690,
    promotionalCents: null,
    stock: 64,
    category: "Cabos e Adaptadores",
    specifications: { conexao: "OTG", uso: "celular", tamanho: "mini" },
    featured: false
  },
  {
    name: "Leitor SD Nano Box",
    description: "Leitor de cartão compacto para tirar arquivo da câmera e seguir o baile.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 34,
    category: "Cabos e Adaptadores",
    specifications: { compatibilidade: "SD e microSD", conexao: "USB-A", corpo: "compacto" },
    featured: false
  },
  {
    name: "Hub USB Trio Simples",
    description: "Multiplica porta USB sem inventar moda e quebra um galho bonito.",
    priceCents: 1990,
    promotionalCents: null,
    stock: 41,
    category: "Utilidades USB",
    specifications: { portas: "3 USB-A", energia: "5V", uso: "mesa" },
    featured: true
  },
  {
    name: "Adaptador P2 USB-C Easy",
    description: "Resolve fone com cabo em celular sem P2 por um preço civilizado.",
    priceCents: 1890,
    promotionalCents: 1590,
    stock: 58,
    category: "Cabos e Adaptadores",
    specifications: { conexao: "USB-C para P2", uso: "audio", formato: "reto" },
    featured: false
  },
  {
    name: "Marcador de Fio Tag",
    description: "Etiquetas simples para identificar cabo sem adivinhar na tomada.",
    priceCents: 590,
    promotionalCents: null,
    stock: 140,
    category: "Cabos e Adaptadores",
    specifications: { pacote: "12 unidades", uso: "organizacao", material: "PVC" },
    featured: false
  },
  {
    name: "Base Adesiva de Cabo",
    description: "Base pequena pra prender fio de mouse, carregador e headphone na mesa.",
    priceCents: 790,
    promotionalCents: null,
    stock: 110,
    category: "Organização de Mesa",
    specifications: { fixacao: "adesiva", pacote: "4 unidades", uso: "mesa" },
    featured: false
  },
  {
    name: "Clip de Mesa Anti Fio",
    description: "Clip simples pra cabo parar de sumir atrás da bancada.",
    priceCents: 490,
    promotionalCents: null,
    stock: 150,
    category: "Organização de Mesa",
    specifications: { material: "silicone", uso: "cabos finos", pacote: "kit com 6" },
    featured: false
  },
  {
    name: "Mini Caixa de Cabos Zip",
    description: "Bolsinha compacta pra cabo, adaptador e cartão SD não virarem bagunça.",
    priceCents: 1790,
    promotionalCents: 1490,
    stock: 46,
    category: "Organização de Mesa",
    specifications: { uso: "cabos e miudezas", fechamento: "zip", porte: "mini" },
    featured: true
  },
  {
    name: "Velcro Organiza Tudo",
    description: "Kit de tiras de velcro pra domar fio de mesa, mochila e home office.",
    priceCents: 990,
    promotionalCents: null,
    stock: 90,
    category: "Organização de Mesa",
    specifications: { pacote: "10 tiras", uso: "cabos", reutilizavel: "sim" },
    featured: false
  },
  {
    name: "Enrolador de Fio Pocket",
    description: "Enrola fone e cabo curto sem virar ninho de dragão no bolso.",
    priceCents: 690,
    promotionalCents: null,
    stock: 132,
    category: "Organização de Mesa",
    specifications: { uso: "fone e cabo curto", material: "silicone", pacote: "2 unidades" },
    featured: false
  },
  {
    name: "Suporte Dobrável Pop",
    description: "Suporte leve pra celular ficar em pé na mesa sem ocupar quase nada.",
    priceCents: 1490,
    promotionalCents: 1290,
    stock: 78,
    category: "Acessórios de Celular",
    specifications: { ajuste: "dobravel", uso: "mesa", material: "ABS" },
    featured: true
  },
  {
    name: "Anel Grip de Celular",
    description: "Argola simples que ajuda na pegada e ainda apoia o celular deitado.",
    priceCents: 890,
    promotionalCents: null,
    stock: 118,
    category: "Acessórios de Celular",
    specifications: { fixacao: "adesiva", uso: "pegada e apoio", material: "metal" },
    featured: false
  },
  {
    name: "Capa Flex Gel Basic",
    description: "Capa simples de silicone flexível pra segurar risco e escorregão do dia a dia.",
    priceCents: 1490,
    promotionalCents: 1290,
    stock: 63,
    category: "Acessórios de Celular",
    specifications: { material: "silicone flex", uso: "protecao basica", pegada: "anti escorregao" },
    featured: false
  },
  {
    name: "Tripé Mini Snap",
    description: "Tripé de bolso pra vídeo rápido, call torta nunca mais.",
    priceCents: 1990,
    promotionalCents: null,
    stock: 36,
    category: "Acessórios de Celular",
    specifications: { uso: "celular", altura: "compacta", formato: "tripé" },
    featured: true
  },
  {
    name: "Suporte Articulado Slim",
    description: "Braço simples de mesa pra segurar celular na altura do olho.",
    priceCents: 1990,
    promotionalCents: 1890,
    stock: 24,
    category: "Suporte e Fixação",
    specifications: { fixacao: "garra", uso: "mesa", ajuste: "articulado" },
    featured: false
  },
  {
    name: "Tampa de Webcam Stealth",
    description: "Capinha deslizante pra webcam parar de encarar tua alma o dia inteiro.",
    priceCents: 490,
    promotionalCents: null,
    stock: 160,
    category: "Acessórios de Notebook",
    specifications: { pacote: "3 unidades", uso: "webcam", fixacao: "adesiva" },
    featured: true
  },
  {
    name: "Tampa Anti Poeira Port",
    description: "Tampinhas simples pra porta USB e USB-C não virarem depósito de poeira.",
    priceCents: 590,
    promotionalCents: null,
    stock: 170,
    category: "Acessórios de Notebook",
    specifications: { pacote: "8 unidades", uso: "portas", material: "silicone" },
    featured: false
  },
  {
    name: "Mini Suporte de Notebook Air",
    description: "Eleva notebook alguns graus e ajuda no respiro sem exagero.",
    priceCents: 1990,
    promotionalCents: 1690,
    stock: 28,
    category: "Acessórios de Notebook",
    specifications: { formato: "dobravel", uso: "notebook", apoio: "base" },
    featured: true
  },
  {
    name: "Luz USB Pocket LED",
    description: "Luzinha USB direta pra teclado, notebook ou cabeceira improvisada.",
    priceCents: 990,
    promotionalCents: null,
    stock: 88,
    category: "Iluminação Pequena",
    specifications: { alimentacao: "USB", uso: "leitura e mesa", luz: "fria" },
    featured: true
  },
  {
    name: "Mini Regua de LEDs USB",
    description: "Barrinha USB pra iluminar bancada, rack ou canto escuro do setupzinho.",
    priceCents: 1490,
    promotionalCents: 1190,
    stock: 54,
    category: "Iluminação Pequena",
    specifications: { alimentacao: "USB", tamanho: "compacto", uso: "mesa e rack" },
    featured: false
  },
  {
    name: "Luminária Clip USB Go",
    description: "Clip flexível com LED pra notebook, livro e improviso noturno honesto.",
    priceCents: 1890,
    promotionalCents: null,
    stock: 42,
    category: "Iluminação Pequena",
    specifications: { alimentacao: "USB", fixacao: "clip", haste: "flexivel" },
    featured: false
  },
  {
    name: "Mini Lanterna USB Flash",
    description: "Lanterna recarregável pequenininha pra mochila, carro e apagão de leve.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 31,
    category: "Iluminação Pequena",
    specifications: { recarga: "USB", uso: "bolso", luz: "LED" },
    featured: true
  },
  {
    name: "Mini Ventilador USB Desk",
    description: "Ventinho de mesa sem luxo, mas já salva o calor do teclado quente.",
    priceCents: 1990,
    promotionalCents: null,
    stock: 39,
    category: "Utilidades USB",
    specifications: { alimentacao: "USB", uso: "mesa", tamanho: "mini" },
    featured: false
  },
  {
    name: "Aquecedor de Caneca USB",
    description: "Base simples pra café não desistir da vida tão rápido.",
    priceCents: 1990,
    promotionalCents: 1890,
    stock: 22,
    category: "Utilidades USB",
    specifications: { alimentacao: "USB", uso: "caneca", formato: "base" },
    featured: false
  },
  {
    name: "Escova de Teclado Dust Off",
    description: "Escovinha fina pra tirar migalha e poeira sem desmontar o teclado inteiro.",
    priceCents: 790,
    promotionalCents: null,
    stock: 104,
    category: "Limpeza Tech",
    specifications: { uso: "teclado", cerdas: "macias", formato: "compacto" },
    featured: true
  },
  {
    name: "Limpador de Tela Duo",
    description: "Spray e flanela no mesmo corpo pra limpar tela sem virar novela.",
    priceCents: 1490,
    promotionalCents: 1290,
    stock: 68,
    category: "Limpeza Tech",
    specifications: { uso: "tela", formato: "2 em 1", recarga: "simples" },
    featured: true
  },
  {
    name: "Pincel Antiestático Nano",
    description: "Pincel pequeno pra limpeza delicada de teclado, entrada e placa leve.",
    priceCents: 1290,
    promotionalCents: null,
    stock: 57,
    category: "Limpeza Tech",
    specifications: { uso: "limpeza fina", cerdas: "antiestaticas", tamanho: "nano" },
    featured: false
  },
  {
    name: "Limpador de Fone Clean Tip",
    description: "Kit simples pra limpar fone intra e case sem sofrimento.",
    priceCents: 990,
    promotionalCents: 790,
    stock: 92,
    category: "Limpeza Tech",
    specifications: { uso: "fone", formato: "caneta", pontas: "3 em 1" },
    featured: false
  },
  {
    name: "Descanso de Cabo Mesa",
    description: "Peça simples que segura cabo na borda e evita puxão idiota.",
    priceCents: 590,
    promotionalCents: null,
    stock: 136,
    category: "Suporte e Fixação",
    specifications: { uso: "borda da mesa", fixacao: "adesiva", pacote: "2 unidades" },
    featured: false
  },
  {
    name: "Suporte de Carregador Wall Dock",
    description: "Segura carregador e cabo na parede sem largar tudo no chão.",
    priceCents: 990,
    promotionalCents: null,
    stock: 74,
    category: "Suporte e Fixação",
    specifications: { uso: "carregador", fixacao: "adesiva", local: "parede" },
    featured: false
  },
  {
    name: "Organizador de Tomada Plug Nest",
    description: "Caixinha simples pra tomada, fonte e excesso de fio sumirem da vista.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 25,
    category: "Suporte e Fixação",
    specifications: { uso: "tomadas", formato: "caixa", material: "ABS" },
    featured: true
  },
  {
    name: "Mouse Bungee Basic",
    description: "Segura o fio do mouse e deixa a mesa menos zona por quase nada.",
    priceCents: 1890,
    promotionalCents: null,
    stock: 33,
    category: "Itens Curiosos de Setup",
    specifications: { uso: "mouse com fio", base: "antiderrapante", formato: "simples" },
    featured: false
  },
  {
    name: "Suporte de Headset Hook",
    description: "Gancho de mesa pra headset parar de viver largado na cadeira.",
    priceCents: 1490,
    promotionalCents: 1190,
    stock: 48,
    category: "Itens Curiosos de Setup",
    specifications: { uso: "headset", fixacao: "mesa", material: "ABS" },
    featured: false
  },
  {
    name: "Descanso Adesivo de Pulso",
    description: "Apoio simples pra punho que quebra o galho em mesa reta demais.",
    priceCents: 1290,
    promotionalCents: null,
    stock: 44,
    category: "Itens Curiosos de Setup",
    specifications: { uso: "mouse ou teclado", fixacao: "adesiva", toque: "macio" },
    featured: false
  },
  {
    name: "Protetor de Quina RGB Fake",
    description: "Protetor de quina com visual tech pra mesa sem machucar cotovelo.",
    priceCents: 790,
    promotionalCents: null,
    stock: 97,
    category: "Itens Curiosos de Setup",
    specifications: { uso: "quina de mesa", material: "silicone", pacote: "4 unidades" },
    featured: false
  },
  {
    name: "Adesivo Antiderrapante Grip Pad",
    description: "Pads simples pra base de teclado, caixinha ou suporte parar de sambar.",
    priceCents: 590,
    promotionalCents: null,
    stock: 148,
    category: "Suporte e Fixação",
    specifications: { uso: "bases", pacote: "8 pads", material: "borracha" },
    featured: false
  },
  {
    name: "Mini Ferramenta de Precisão Kit",
    description: "Kit básico de chave pequena pra eletrônico simples e bugiganga teimosa.",
    priceCents: 1990,
    promotionalCents: 1890,
    stock: 27,
    category: "Mini Ferramentas Tech",
    specifications: { conteudo: "bits basicos", uso: "eletronicos leves", case: "sim" },
    featured: true
  },
  {
    name: "Abridor de Chip Pocket",
    description: "Ferramenta pequena pra bandeja de chip não depender de clipe torto.",
    priceCents: 490,
    promotionalCents: null,
    stock: 180,
    category: "Mini Ferramentas Tech",
    specifications: { uso: "SIM card", material: "metal", pacote: "2 unidades" },
    featured: false
  },
  {
    name: "Trava de Cabo Mini Lock",
    description: "Prende cabo em rota fixa e evita puxão acidental em carregador ou USB.",
    priceCents: 790,
    promotionalCents: null,
    stock: 101,
    category: "Mini Ferramentas Tech",
    specifications: { uso: "cabos", fixacao: "adesiva", pacote: "4 unidades" },
    featured: false
  },
  {
    name: "Case de Pilha Snap Box",
    description: "Caixinha compacta pra pilha ou bateria pequena não ficar solta na bolsa.",
    priceCents: 990,
    promotionalCents: null,
    stock: 62,
    category: "Mini Ferramentas Tech",
    specifications: { uso: "pilha e bateria", material: "plastico", porte: "bolso" },
    featured: false
  },
  {
    name: "Bolsinha Tech Grid",
    description: "Bolsinha de acessórios pra cabo, adaptador e miudeza nerd do dia a dia.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 30,
    category: "Viagem e Escritório",
    specifications: { uso: "acessorios", fechamento: "zip", formato: "organizador" },
    featured: true
  },
  {
    name: "Organizador de Mochila Tech",
    description: "Divisórias leves pra miudeza eletrônica parar de passear na mochila.",
    priceCents: 1990,
    promotionalCents: null,
    stock: 21,
    category: "Viagem e Escritório",
    specifications: { uso: "mochila", bolsos: "multiplos", material: "nylon" },
    featured: false
  },
  {
    name: "Suporte de Parede para Roteador",
    description: "Base leve pra roteador pequeno sair do chão e respirar melhor.",
    priceCents: 1890,
    promotionalCents: 1690,
    stock: 18,
    category: "Viagem e Escritório",
    specifications: { uso: "roteador leve", fixacao: "parede", material: "ABS" },
    featured: false
  },
  {
    name: "Suporte de Controle Wall Pop",
    description: "Gancho de parede simples pra controle remoto ou joystick leve.",
    priceCents: 1290,
    promotionalCents: null,
    stock: 49,
    category: "Viagem e Escritório",
    specifications: { uso: "controle", fixacao: "adesiva", pacote: "2 unidades" },
    featured: false
  },
  {
    name: "Abafador de Porta Key Quiet",
    description: "Peça simples pra diminuir batida seca em porta de quarto ou escritório.",
    priceCents: 990,
    promotionalCents: null,
    stock: 67,
    category: "Viagem e Escritório",
    specifications: { uso: "porta", material: "silicone", pacote: "kit" },
    featured: false
  },
  {
    name: "Luz de Porta USB Car",
    description: "Luzinha USB pequena pra carro, bagageiro ou canto escuro do painel.",
    priceCents: 1490,
    promotionalCents: 1190,
    stock: 38,
    category: "Carro e Viagem",
    specifications: { alimentacao: "USB", uso: "carro", luz: "LED" },
    featured: false
  },
  {
    name: "Suporte de Celular Vent Clip",
    description: "Suporte simples de saída de ar pra GPS não virar teste de reflexo.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 29,
    category: "Carro e Viagem",
    specifications: { uso: "carro", fixacao: "saida de ar", ajuste: "basico" },
    featured: true
  },
  {
    name: "Mini Lanterna de Chaveiro Beam",
    description: "Luzinha de chaveiro pra mochila, fechadura e improviso noturno baratinho.",
    priceCents: 890,
    promotionalCents: null,
    stock: 112,
    category: "Carro e Viagem",
    specifications: { uso: "chaveiro", luz: "LED", porte: "mini" },
    featured: false
  },
  {
    name: "Tag Localizador Analógica",
    description: "Chaveiro simples e colorido pra bolsa, mala ou case não sumirem na correria.",
    priceCents: 690,
    promotionalCents: null,
    stock: 95,
    category: "Carro e Viagem",
    specifications: { uso: "identificacao", material: "ABS", argola: "sim" },
    featured: false
  },
  {
    name: "Suporte de Tablet Fold Easy",
    description: "Apoio dobrável pra tablet ou ebook sem gastar espaço nem paciência.",
    priceCents: 1990,
    promotionalCents: null,
    stock: 26,
    category: "Acessórios de Notebook",
    specifications: { uso: "tablet", formato: "dobravel", material: "ABS" },
    featured: false
  },
  {
    name: "Case de Cartão SD Pocket",
    description: "Guarda cartão SD e microSD num case que cabe no bolso sem drama.",
    priceCents: 1090,
    promotionalCents: 890,
    stock: 58,
    category: "Acessórios de Notebook",
    specifications: { uso: "cartoes", capacidade: "4 a 6", formato: "compacto" },
    featured: false
  },
  {
    name: "Protetor de Plug Soft Cap",
    description: "Capinhas simples pra ponta de cabo não ficar raspando e marcando.",
    priceCents: 590,
    promotionalCents: null,
    stock: 155,
    category: "Cabos e Adaptadores",
    specifications: { uso: "plugs", material: "silicone", pacote: "6 unidades" },
    featured: false
  },
  {
    name: "Mouse Pad Mini Spot",
    description: "Mouse pad pequeno pra canto de notebook, balcão ou trampo improvisado.",
    priceCents: 1190,
    promotionalCents: null,
    stock: 52,
    category: "Itens Curiosos de Setup",
    specifications: { uso: "mouse", base: "antiderrapante", tamanho: "mini" },
    featured: false
  },
  {
    name: "Suporte de Cabo Charger Hook",
    description: "Gancho simples pra deixar carregador sempre no mesmo ponto da mesa.",
    priceCents: 690,
    promotionalCents: null,
    stock: 125,
    category: "Organização de Mesa",
    specifications: { uso: "carregador", fixacao: "adesiva", pacote: "3 unidades" },
    featured: false
  },
  {
    name: "Suporte Multiuso Stick Arm",
    description: "Braço adesivo pequeno pra segurar controle, celular leve ou cabo grosso.",
    priceCents: 1590,
    promotionalCents: 1390,
    stock: 35,
    category: "Suporte e Fixação",
    specifications: { uso: "multiuso", fixacao: "adesiva", ajuste: "simples" },
    featured: false
  },
  {
    name: "Kit Anti Poeira Laptop",
    description: "Pacotinho com tampas e escovinha pra notebook não virar criadouro de pó.",
    priceCents: 1490,
    promotionalCents: null,
    stock: 47,
    category: "Limpeza Tech",
    specifications: { conteudo: "tampas e escova", uso: "notebook", formato: "kit" },
    featured: false
  },
  {
    name: "Fone de Ouvido Zip P2",
    description: "Fone com cabo simples pra quebra-galho honesto em celular, notebook e ônibus.",
    priceCents: 1990,
    promotionalCents: 1790,
    stock: 37,
    category: "Acessórios de Celular",
    specifications: { conexao: "P2", uso: "audio basico", microfone: "simples" },
    featured: false
  }
];

const accentByCategory: Record<string, string> = {
  "Cabos e Adaptadores": "#3df5a5",
  "Organização de Mesa": "#69b7ff",
  "Acessórios de Celular": "#55c8ff",
  "Iluminação Pequena": "#3df5a5",
  "Utilidades USB": "#7ef7cd",
  "Limpeza Tech": "#69b7ff",
  "Suporte e Fixação": "#55c8ff",
  "Mini Ferramentas Tech": "#3df5a5",
  "Itens Curiosos de Setup": "#7ef7cd",
  "Acessórios de Notebook": "#69b7ff",
  "Viagem e Escritório": "#55c8ff",
  "Carro e Viagem": "#3df5a5"
};

const products = rawProducts.map((product) => ({
  ...product,
  imageUrl: imagePlaceholder(
    product.name,
    product.category,
    accentByCategory[product.category] ?? "#3df5a5"
  )
}));

const coupons = [
  {
    code: "BEMVINDO10",
    type: "PERCENT" as const,
    value: 10,
    minOrderCents: 3000,
    firstPurchaseOnly: true
  },
  {
    code: "MENOS20",
    type: "FIXED" as const,
    value: 2000,
    minOrderCents: 6000,
    firstPurchaseOnly: false
  },
  {
    code: "FRETEGRATIS",
    type: "FREE_SHIPPING" as const,
    value: null,
    minOrderCents: 4500,
    firstPurchaseOnly: false
  }
];

async function syncProducts() {
  const seededSlugs = new Set(products.map((product) => slugify(product.name)));

  for (const product of products) {
    const slug = slugify(product.name);
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, stock: true }
    });

    if (existing) {
      const stockDelta = product.stock - existing.stock;

      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          specifications: product.specifications,
          priceCents: product.priceCents,
          promotionalCents: product.promotionalCents,
          stock: product.stock,
          active: true,
          featured: product.featured
        }
      });

      if (stockDelta !== 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: existing.id,
            type: "ADJUSTMENT",
            quantity: stockDelta,
            note: "Ajuste de estoque pelo seed do catalogo"
          }
        });
      }

      continue;
    }

    const saved = await prisma.product.create({
      data: {
        ...product,
        slug
      }
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: saved.id,
        type: "SEED",
        quantity: product.stock,
        note: "Estoque inicial do seed"
      }
    });
  }

  const staleProducts = await prisma.product.findMany({
    where: {
      slug: { notIn: Array.from(seededSlugs) }
    },
    select: { id: true, slug: true }
  });

  for (const staleProduct of staleProducts) {
    const references = await prisma.orderItem.count({
      where: { productId: staleProduct.id }
    });

    if (references > 0) {
      await prisma.product.update({
        where: { id: staleProduct.id },
        data: {
          active: false,
          featured: false
        }
      });
      continue;
    }

    await prisma.inventoryMovement.deleteMany({
      where: { productId: staleProduct.id }
    });
    await prisma.cartItem.deleteMany({
      where: { productId: staleProduct.id }
    });
    await prisma.product.delete({
      where: { id: staleProduct.id }
    });
  }
}

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@10pila.local";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "change-me-before-deploy";

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name: "Admin 10PILA",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  await syncProducts();

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
