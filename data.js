'use strict';
/* =========================================================================
   DIBUJO IMPOSTOR — pares de conceptos parecidos pero distintos
   Todos los jugadores reciben el mismo concepto (A) salvo el/los
   impostor(es), que reciben el concepto B: parecido, pero no igual.
   Contenido 100% original.
   ========================================================================= */

var PAIR_CATEGORIES = {
  animales: {
    label: 'Animales',
    pairs: [
      { a: { nombre: 'Perro', emoji: '🐶' }, b: { nombre: 'Lobo', emoji: '🐺' } },
      { a: { nombre: 'Gato', emoji: '🐱' }, b: { nombre: 'Tigre', emoji: '🐯' } },
      { a: { nombre: 'Caballo', emoji: '🐴' }, b: { nombre: 'Cebra', emoji: '🦓' } },
      { a: { nombre: 'Delfín', emoji: '🐬' }, b: { nombre: 'Tiburón', emoji: '🦈' } },
      { a: { nombre: 'Oso', emoji: '🐻' }, b: { nombre: 'Panda', emoji: '🐼' } },
      { a: { nombre: 'Conejo', emoji: '🐰' }, b: { nombre: 'Ardilla', emoji: '🐿️' } },
      { a: { nombre: 'Pingüino', emoji: '🐧' }, b: { nombre: 'Foca', emoji: '🦭' } },
      { a: { nombre: 'León', emoji: '🦁' }, b: { nombre: 'Gorila', emoji: '🦍' } },
      { a: { nombre: 'Loro', emoji: '🦜' }, b: { nombre: 'Pavo real', emoji: '🦚' } },
      { a: { nombre: 'Rana', emoji: '🐸' }, b: { nombre: 'Camaleón', emoji: '🦎' } }
    ]
  },
  transporte: {
    label: 'Transporte',
    pairs: [
      { a: { nombre: 'Avión', emoji: '✈️' }, b: { nombre: 'Helicóptero', emoji: '🚁' } },
      { a: { nombre: 'Coche', emoji: '🚗' }, b: { nombre: 'Camión', emoji: '🚚' } },
      { a: { nombre: 'Bicicleta', emoji: '🚲' }, b: { nombre: 'Moto', emoji: '🏍️' } },
      { a: { nombre: 'Barco', emoji: '🚢' }, b: { nombre: 'Ferry', emoji: '⛴️' } },
      { a: { nombre: 'Tren', emoji: '🚆' }, b: { nombre: 'Metro', emoji: '🚇' } },
      { a: { nombre: 'Cohete', emoji: '🚀' }, b: { nombre: 'Globo aerostático', emoji: '🎈' } },
      { a: { nombre: 'Taxi', emoji: '🚕' }, b: { nombre: 'Autobús', emoji: '🚌' } }
    ]
  },
  comida: {
    label: 'Comida',
    pairs: [
      { a: { nombre: 'Manzana', emoji: '🍎' }, b: { nombre: 'Pera', emoji: '🍐' } },
      { a: { nombre: 'Hamburguesa', emoji: '🍔' }, b: { nombre: 'Sándwich', emoji: '🥪' } },
      { a: { nombre: 'Plátano', emoji: '🍌' }, b: { nombre: 'Pepino', emoji: '🥒' } },
      { a: { nombre: 'Pizza', emoji: '🍕' }, b: { nombre: 'Tarta', emoji: '🥧' } },
      { a: { nombre: 'Donut', emoji: '🍩' }, b: { nombre: 'Magdalena', emoji: '🧁' } },
      { a: { nombre: 'Uvas', emoji: '🍇' }, b: { nombre: 'Arándanos', emoji: '🫐' } },
      { a: { nombre: 'Zanahoria', emoji: '🥕' }, b: { nombre: 'Maíz', emoji: '🌽' } }
    ]
  },
  lugares: {
    label: 'Lugares',
    pairs: [
      { a: { nombre: 'Playa', emoji: '🏖️' }, b: { nombre: 'Desierto', emoji: '🏜️' } },
      { a: { nombre: 'Castillo', emoji: '🏰' }, b: { nombre: 'Iglesia', emoji: '⛪' } },
      { a: { nombre: 'Montaña', emoji: '⛰️' }, b: { nombre: 'Volcán', emoji: '🌋' } },
      { a: { nombre: 'Bosque', emoji: '🌲' }, b: { nombre: 'Palmera', emoji: '🌴' } },
      { a: { nombre: 'Ciudad', emoji: '🏙️' }, b: { nombre: 'Pueblo', emoji: '🏘️' } },
      { a: { nombre: 'Faro', emoji: '🗼' }, b: { nombre: 'Molino', emoji: '🏭' } }
    ]
  },
  objetos: {
    label: 'Objetos',
    pairs: [
      { a: { nombre: 'Reloj de pulsera', emoji: '⌚' }, b: { nombre: 'Reloj de pared', emoji: '🕰️' } },
      { a: { nombre: 'Libro', emoji: '📖' }, b: { nombre: 'Cuaderno', emoji: '📓' } },
      { a: { nombre: 'Llave', emoji: '🔑' }, b: { nombre: 'Candado', emoji: '🔒' } },
      { a: { nombre: 'Vela', emoji: '🕯️' }, b: { nombre: 'Bombilla', emoji: '💡' } },
      { a: { nombre: 'Paraguas', emoji: '☂️' }, b: { nombre: 'Sombrilla', emoji: '⛱️' } },
      { a: { nombre: 'Guitarra', emoji: '🎸' }, b: { nombre: 'Violín', emoji: '🎻' } }
    ]
  }
};

var PAIR_CATEGORY_KEYS = Object.keys(PAIR_CATEGORIES);
var PAIR_MEZCLA_KEY = 'mezcla';
