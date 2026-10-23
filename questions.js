// Rodadas do jogo, na mesma ordem do ROTEIRO-IMAGENS.md. Para trocar imagens ou dicas, é só editar este arquivo.
//
// type "pair":   duas imagens; "real" é o índice da foto verdadeira (0 = primeira, 1 = segunda)
// type "single": uma imagem; "isReal" diz se é uma foto de verdade (true) ou de IA (false)
// "tip":         texto que aparece depois da resposta
//
// As imagens (4:3, de preferência 1200x900) ficam na pasta img/. Depois de qualquer mudança,
// aumente CACHE_VERSION em sw.js para o iPad baixar a versão nova.
//
// ATENÇÃO: várias imagens ainda são placeholders de teste, e as dicas são provisórias.
// Ajuste cada dica olhando a imagem final.
var QUESTIONS = [
  {
    // 1. Mão com cubo mágico
    type: "pair",
    images: ["img/cube-real.jpg", "img/cube-ai.jpg"],
    real: 0,
    tip: "A IA costuma errar os dedos da mão e as cores do cubo. Compare os dois com calma.",
  },
  {
    // 2. Churrasco
    type: "pair",
    images: ["img/bbq-ai.jpg", "img/bbq-real.jpg"],
    real: 1,
    tip: "Fumaça, brasa e gordura derretendo são difíceis para a IA. Na foto real cada pedaço de carne tem seu jeito.",
  },
  {
    // 3. Macarrão no garfo (real)
    type: "single",
    image: "img/pasta-real.jpg",
    isReal: true,
    tip: "Essa é real! Na foto de verdade cada fio de macarrão segue o seu caminho. A IA costuma fundir os fios e colocar dentes a mais no garfo.",
  },
  {
    // 4. Teclado
    type: "pair",
    images: ["img/keyboard-real.jpg", "img/keyboard-ai.jpg"],
    real: 0,
    tip: "Teclas e letras são um desafio: a IA costuma repetir, apagar ou inventar símbolos nas teclas.",
  },
  {
    // 5. Relógio de parede (real)
    type: "single",
    image: "img/clock-real.jpg",
    isReal: true,
    tip: "Essa é real! A IA costuma errar a ordem e a quantidade dos números do relógio. Aqui está tudo certo.",
  },
  {
    // 6. Reflexo de prédio na poça
    type: "pair",
    images: ["img/puddle-ai.jpg", "img/puddle-real.jpg"],
    real: 1,
    tip: "O reflexo tem que combinar com o que está acima dele. A IA nem sempre acerta a perspectiva e os detalhes.",
  },
  {
    // 7. Parquinho (real)
    type: "single",
    image: "img/playground-real.jpg",
    isReal: true,
    tip: "Essa é real! Em cenas cheias de detalhes, como escorregadores e grades, a IA costuma deformar as estruturas. Aqui tudo faz sentido.",
  },
  {
    // 8. Lego (IA)
    type: "single",
    image: "img/lego-ai.jpg",
    isReal: false,
    tip: "Essa é de IA! No Lego cada peça tem forma e encaixe certos. A IA costuma misturar peças e criar encaixes impossíveis.",
  },
  {
    // 9. Hambúrguer (IA)
    type: "single",
    image: "img/hamburger-ai.jpg",
    isReal: false,
    tip: "Essa é de IA! Olhe o rótulo da garrafa de ketchup ao fundo: textos gerados por IA costumam não formar palavras de verdade.",
  },
  {
    // 10. Cardume de peixes (real)
    type: "single",
    image: "img/fish-real.jpg",
    isReal: true,
    tip: "Essa é real! Num cardume a IA costuma misturar os peixes numa mancha. Aqui cada um tem o seu formato.",
  },
];
