// Banco de dados base de palavras, categorias e recursos para a aplicação de Terapia da Fala

const DEFAULT_WORDS = [
  // Categoria: Animais
  { palavra: "Gato", silabas: "Ga-to", categoria: "Animais", fonema: "G", rima: "ato", imagem: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Rato", silabas: "Ra-to", categoria: "Animais", fonema: "R", rima: "ato", imagem: "https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Pato", silabas: "Pa-to", categoria: "Animais", fonema: "P", rima: "ato", imagem: "https://images.unsplash.com/photo-1555890832-689f5c15e666?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Cão", silabas: "Cão", categoria: "Animais", fonema: "C", rima: "ão", imagem: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Sapo", silabas: "Sa-po", categoria: "Animais", fonema: "S", rima: "apo", imagem: "https://images.unsplash.com/photo-1554825203-68321ddde262?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Leão", silabas: "Le-ão", categoria: "Animais", fonema: "L", rima: "ão", imagem: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Macaco", silabas: "Ma-ca-co", categoria: "Animais", fonema: "M", rima: "aco", imagem: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Ovelha", silabas: "O-ve-lha", categoria: "Animais", fonema: "LH", rima: "elha", imagem: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Comida (Fruta/Legumes)
  { palavra: "Maçã", silabas: "Ma-çã", categoria: "Comida", fonema: "M", rima: "ã", imagem: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Banana", silabas: "Ba-na-na", categoria: "Comida", fonema: "B", rima: "ana", imagem: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Pêra", silabas: "Pê-ra", categoria: "Comida", fonema: "P", rima: "era", imagem: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Morango", silabas: "Mo-ran-go", categoria: "Comida", fonema: "M", rima: "ango", imagem: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Melancia", silabas: "Me-lan-ci-a", categoria: "Comida", fonema: "M", rima: "ia", imagem: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Cenoura", silabas: "Ce-nou-ra", categoria: "Comida", fonema: "S", rima: "oura", imagem: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Uvas", silabas: "U-vas", categoria: "Comida", fonema: "V", rima: "uvas", imagem: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Roupas
  { palavra: "Sapato", silabas: "Sa-pa-to", categoria: "Roupa", fonema: "S", rima: "ato", imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Chapéu", silabas: "Cha-péu", categoria: "Roupa", fonema: "CH", rima: "éu", imagem: "https://images.unsplash.com/photo-1533055640609-24b498dfd74c?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Meias", silabas: "Mei-as", categoria: "Roupa", fonema: "M", rima: "eias", imagem: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Calças", silabas: "Cal-ças", categoria: "Roupa", fonema: "C", rima: "alças", imagem: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Casaco", silabas: "Ca-sa-co", categoria: "Roupa", fonema: "S", rima: "aco", imagem: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Transportes
  { palavra: "Carro", silabas: "Car-ro", categoria: "Transportes", fonema: "RR", rima: "arro", imagem: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Avião", silabas: "A-vi-ão", categoria: "Transportes", fonema: "V", rima: "ão", imagem: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Barco", silabas: "Bar-co", categoria: "Transportes", fonema: "B", rima: "arco", imagem: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Comboio", silabas: "Com-boi-o", categoria: "Transportes", fonema: "C", rima: "oio", imagem: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Objetos / Casa
  { palavra: "Casa", silabas: "Ca-sa", categoria: "Objetos", fonema: "S", rima: "asa", imagem: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Bola", silabas: "Bo-la", categoria: "Objetos", fonema: "B", rima: "ola", imagem: "https://images.unsplash.com/photo-1589807185416-f44efb11273e?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Mesa", silabas: "Me-sa", categoria: "Objetos", fonema: "S", rima: "esa", imagem: "https://images.unsplash.com/photo-1530018607912-eff2df114f11?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Colher", silabas: "Co-lher", categoria: "Objetos", fonema: "LH", rima: "er", imagem: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Copo", silabas: "Co-po", categoria: "Objetos", fonema: "C", rima: "opo", imagem: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Chave", silabas: "Cha-ve", categoria: "Objetos", fonema: "CH", rima: "ave", imagem: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Brinquedos
  { palavra: "Urso", silabas: "Ur-so", categoria: "Brinquedos", fonema: "S", rima: "urso", imagem: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Boneca", silabas: "Bo-ne-ca", categoria: "Brinquedos", fonema: "B", rima: "eca", imagem: "https://images.unsplash.com/photo-1558877385-81a7cbc503bc?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Blocos", silabas: "Blo-cos", categoria: "Brinquedos", fonema: "B", rima: "ocos", imagem: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Patinete", silabas: "Pa-ti-ne-te", categoria: "Brinquedos", fonema: "P", rima: "ete", imagem: "https://images.unsplash.com/photo-1513224502586-d1e602410265?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Instrumentos
  { palavra: "Tambor", silabas: "Tam-bor", categoria: "Instrumentos", fonema: "T", rima: "or", imagem: "https://images.unsplash.com/photo-1543443374-b6fe10a6ab7b?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Piano", silabas: "Pi-a-no", categoria: "Instrumentos", fonema: "P", rima: "ano", imagem: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80&auto=format&fit=crop" },

  // Categoria: Corpo
  { palavra: "Mão", silabas: "Mão", categoria: "Corpo", fonema: "M", rima: "ão", imagem: "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=400&q=80&auto=format&fit=crop" },
  { palavra: "Nariz", silabas: "Na-riz", categoria: "Corpo", fonema: "N", rima: "iz", imagem: "https://images.unsplash.com/photo-1616150638538-ffb0679a3fc4?w=400&q=80&auto=format&fit=crop" }
];

const DEFAULT_CARETA_ACTIONS = [
  { texto: "Enche as duas bochechas de ar!", emoji: "🐡" },
  { texto: "Deita a língua fora e tenta tocar no nariz!", emoji: "😛" },
  { texto: "Dá um beijo estalado bem barulhento!", emoji: "💋" },
  { texto: "Faz um sorriso gigante sem mostrar os dentes!", emoji: "😊" },
  { texto: "Imita o som de uma abelha zangada: ZZZZZ!", emoji: "🐝" },
  { texto: "Estala a língua como se fosses um cavalo!", emoji: "🐴" },
  { texto: "Enche uma bochecha de cada vez com ar!", emoji: "🐿️" },
  { texto: "Morde levemente o lábio inferior!", emoji: "😬" }
];

const DEFAULT_SCENES = {
  praia: {
    nome: "Dia na Praia",
    fundo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&auto=format&fit=crop",
    elementos: [
      { id: "p1", nome: "Caranguejo", img: "https://images.unsplash.com/photo-1553618551-fba689030290?w=150&auto=format&fit=crop" },
      { id: "p2", nome: "Bola de Praia", img: "https://images.unsplash.com/photo-1589807185416-f44efb11273e?w=150&auto=format&fit=crop" },
      { id: "p3", nome: "Estrela do Mar", img: "https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?w=150&auto=format&fit=crop" },
      { id: "p4", nome: "Balde", img: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=150&auto=format&fit=crop" },
      { id: "p5", nome: "Peixinho", img: "https://images.unsplash.com/photo-1524704654690-b56c05c78a02?w=150&auto=format&fit=crop" }
    ]
  },
  espaco: {
    nome: "Missão Espacial",
    fundo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80&auto=format&fit=crop",
    elementos: [
      { id: "e1", nome: "Foguetão", img: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=150&auto=format&fit=crop" },
      { id: "e2", nome: "Astronauta", img: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop" },
      { id: "e3", nome: "Alienígena", img: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=150&auto=format&fit=crop" },
      { id: "e4", nome: "Disco Voador", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150&auto=format&fit=crop" },
      { id: "e5", nome: "Planeta", img: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=150&auto=format&fit=crop" }
    ]
  }
};

const DEFAULT_SEQUENCES = [
  {
    nome: "Plantar uma Flor",
    etapas: [
      { ordem: 1, texto: "Primeiro, plantamos a semente na terra.", imagem: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=300&q=80&auto=format&fit=crop" },
      { ordem: 2, texto: "Depois, regamos a terra com água.", imagem: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80&auto=format&fit=crop" },
      { ordem: 3, texto: "Por fim, a flor cresce e fica bonita!", imagem: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=300&q=80&auto=format&fit=crop" }
    ]
  },
  {
    nome: "Lavar as Mãos",
    etapas: [
      { ordem: 1, texto: "Primeiro, colocamos o sabão nas mãos.", imagem: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=300&q=80&auto=format&fit=crop" },
      { ordem: 2, texto: "Depois, esfregamos bem com água na torneira.", imagem: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&q=80&auto=format&fit=crop" },
      { ordem: 3, texto: "Por fim, secamos as mãos com a toalha.", imagem: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&q=80&auto=format&fit=crop" }
    ]
  }
];

const DEFAULT_TRAVA_LINGUAS = [
  { texto: "O rato roeu a rolha da garrafa do rei de Roma.", emoji: "🐀" },
  { texto: "Três pratos de trigo para três tigres tristes.", emoji: "🐯" },
  { texto: "O aranha arranha a rã, a rã arranha o aranha.", emoji: "🕷️" },
  { texto: "O peito do pé de Pedro é preto.", emoji: "🦶" },
  { texto: "Sabia que o sábio sabia que o sabiá sabia assobiar?", emoji: "🐦" },
  { texto: "Bagre branco, branco bagre, bagre preto, preto bagre.", emoji: "🐟" }
];

const DEFAULT_VERBS = [
  "come 🍽️",
  "corre para 🏃",
  "bebe 🥛",
  "salta sobre 🤸",
  "voa em 🪽",
  "dorme na 💤",
  "brinca com 🧸"
];

const DEFAULT_CATEGORIES = [
  { nome: "Animais", emoji: "🦁" },
  { nome: "Comida", emoji: "🍏" },
  { nome: "Roupa", emoji: "👕" },
  { nome: "Transportes", emoji: "🚗" },
  { nome: "Objetos", emoji: "🔑" },
  { nome: "Brinquedos", emoji: "🧸" },
  { nome: "Instrumentos", emoji: "🥁" },
  { nome: "Corpo", emoji: "👃" }
];
