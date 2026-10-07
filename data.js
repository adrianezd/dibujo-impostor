'use strict';

/* =========================================================================
   DIBUJO IMPOSTOR — pares de conceptos parecidos pero distintos
   En el modo Clásico todos dibujan el concepto A salvo el/los impostor(es),
   que reciben el B: parecido, pero no igual. En los modos «A ciegas» y
   «Lienzo compartido» se usa solo el concepto A. Contenido 100% original.
   ========================================================================= */

function P(a, emojiA, b, emojiB) {
  return { a: { nombre: a, emoji: emojiA }, b: { nombre: b, emoji: emojiB } };
}

const PAIR_CATEGORIES = {
  animales: {
    label: 'Animales', emoji: '🐾',
    pairs: [
      P('Perro', '🐶', 'Lobo', '🐺'), P('Gato', '🐱', 'Tigre', '🐯'), P('Caballo', '🐴', 'Cebra', '🦓'),
      P('Delfín', '🐬', 'Tiburón', '🦈'), P('Oso', '🐻', 'Panda', '🐼'), P('Conejo', '🐰', 'Ardilla', '🐿️'),
      P('Pingüino', '🐧', 'Foca', '🦭'), P('León', '🦁', 'Gorila', '🦍'), P('Loro', '🦜', 'Pavo real', '🦚'),
      P('Rana', '🐸', 'Camaleón', '🦎'), P('Vaca', '🐮', 'Cerdo', '🐷'), P('Pulpo', '🐙', 'Calamar', '🦑'),
      P('Abeja', '🐝', 'Mariquita', '🐞'), P('Elefante', '🐘', 'Rinoceronte', '🦏'), P('Jirafa', '🦒', 'Camello', '🐫'),
      P('Búho', '🦉', 'Águila', '🦅'), P('Serpiente', '🐍', 'Cocodrilo', '🐊'), P('Caracol', '🐌', 'Tortuga', '🐢'),
      P('Ballena', '🐋', 'Pez', '🐟'), P('Mariposa', '🦋', 'Murciélago', '🦇')
    ]
  },
  comida: {
    label: 'Comida', emoji: '🍕',
    pairs: [
      P('Manzana', '🍎', 'Pera', '🍐'), P('Hamburguesa', '🍔', 'Sándwich', '🥪'), P('Plátano', '🍌', 'Pepino', '🥒'),
      P('Pizza', '🍕', 'Tarta', '🥧'), P('Donut', '🍩', 'Magdalena', '🧁'), P('Uvas', '🍇', 'Cerezas', '🍒'),
      P('Zanahoria', '🥕', 'Maíz', '🌽'), P('Helado', '🍦', 'Batido', '🥤'), P('Huevo frito', '🍳', 'Tortita', '🥞'),
      P('Sandía', '🍉', 'Melón', '🍈'), P('Perrito caliente', '🌭', 'Burrito', '🌯'), P('Espaguetis', '🍝', 'Ramen', '🍜'),
      P('Fresa', '🍓', 'Tomate', '🍅'), P('Palomitas', '🍿', 'Patatas fritas', '🍟'), P('Croissant', '🥐', 'Pan', '🍞'),
      P('Piña', '🍍', 'Coco', '🥥'), P('Queso', '🧀', 'Mantequilla', '🧈'), P('Sushi', '🍣', 'Brocheta', '🍢')
    ]
  },
  transporte: {
    label: 'Transporte', emoji: '🚀',
    pairs: [
      P('Avión', '✈️', 'Helicóptero', '🚁'), P('Coche', '🚗', 'Camión', '🚚'), P('Bicicleta', '🚲', 'Moto', '🏍️'),
      P('Barco', '🚢', 'Submarino', '🌊'), P('Tren', '🚆', 'Tranvía', '🚋'), P('Cohete', '🚀', 'Ovni', '🛸'),
      P('Taxi', '🚕', 'Autobús', '🚌'), P('Globo aerostático', '🎈', 'Paracaídas', '🪂'), P('Velero', '⛵', 'Canoa', '🛶'),
      P('Ambulancia', '🚑', 'Camión de bomberos', '🚒'), P('Patinete', '🛴', 'Monopatín', '🛹'), P('Tractor', '🚜', 'Excavadora', '🏗️')
    ]
  },
  lugares: {
    label: 'Lugares', emoji: '📍',
    pairs: [
      P('Playa', '🏖️', 'Desierto', '🏜️'), P('Castillo', '🏰', 'Iglesia', '⛪'), P('Montaña', '⛰️', 'Volcán', '🌋'),
      P('Bosque', '🌲', 'Selva', '🌴'), P('Ciudad', '🏙️', 'Pueblo', '🏘️'), P('Faro', '🗼', 'Molino', '🌾'),
      P('Isla', '🏝️', 'Barco pirata', '🏴‍☠️'), P('Camping', '🏕️', 'Cabaña', '🛖'), P('Estadio', '🏟️', 'Circo', '🎪'),
      P('Hospital', '🏥', 'Colegio', '🏫'), P('Noria', '🎡', 'Montaña rusa', '🎢'), P('Iglú', '🧊', 'Tienda de campaña', '⛺')
    ]
  },
  objetos: {
    label: 'Objetos', emoji: '🧸',
    pairs: [
      P('Reloj de pulsera', '⌚', 'Reloj de pared', '🕰️'), P('Libro', '📖', 'Cuaderno', '📓'), P('Llave', '🔑', 'Candado', '🔒'),
      P('Vela', '🕯️', 'Bombilla', '💡'), P('Paraguas', '☂️', 'Sombrilla', '⛱️'), P('Gafas', '👓', 'Prismáticos', '🔭'),
      P('Tijeras', '✂️', 'Pinzas', '🗜️'), P('Martillo', '🔨', 'Hacha', '🪓'), P('Teléfono móvil', '📱', 'Mando a distancia', '🎮'),
      P('Silla', '🪑', 'Sofá', '🛋️'), P('Cama', '🛏️', 'Hamaca', '🏝️'), P('Taza', '☕', 'Tetera', '🫖'),
      P('Escoba', '🧹', 'Fregona', '🪣'), P('Regalo', '🎁', 'Caja de cartón', '📦'), P('Globo', '🎈', 'Cometa', '🪁'),
      P('Imán', '🧲', 'Herradura', '🐴')
    ]
  },
  deportes: {
    label: 'Deportes', emoji: '⚽',
    pairs: [
      P('Fútbol', '⚽', 'Rugby', '🏉'), P('Baloncesto', '🏀', 'Voleibol', '🏐'), P('Tenis', '🎾', 'Ping-pong', '🏓'),
      P('Esquí', '⛷️', 'Snowboard', '🏂'), P('Surf', '🏄', 'Natación', '🏊'), P('Boxeo', '🥊', 'Kárate', '🥋'),
      P('Golf', '⛳', 'Hockey', '🏑'), P('Bolos', '🎳', 'Billar', '🎱'), P('Ciclismo', '🚴', 'Equitación', '🏇'),
      P('Escalada', '🧗', 'Senderismo', '🥾'), P('Tiro con arco', '🏹', 'Dardos', '🎯'), P('Pesas', '🏋️', 'Yoga', '🧘')
    ]
  },
  profesiones: {
    label: 'Profesiones', emoji: '👩‍🔧',
    pairs: [
      P('Bombero', '👨‍🚒', 'Policía', '👮'), P('Médico', '👩‍⚕️', 'Dentista', '🦷'), P('Cocinero', '👨‍🍳', 'Panadero', '🥖'),
      P('Astronauta', '👩‍🚀', 'Buzo', '🤿'), P('Pintor', '👨‍🎨', 'Fotógrafo', '📷'), P('Granjero', '👩‍🌾', 'Jardinero', '🌻'),
      P('Pirata', '🏴‍☠️', 'Vaquero', '🤠'), P('Mago', '🎩', 'Payaso', '🤡'), P('Cantante', '🎤', 'DJ', '🎧'),
      P('Detective', '🕵️', 'Ladrón', '💰'), P('Profesor', '👩‍🏫', 'Juez', '👨‍⚖️'), P('Mecánico', '🔧', 'Electricista', '⚡')
    ]
  },
  casa: {
    label: 'En casa', emoji: '🏠',
    pairs: [
      P('Nevera', '🧊', 'Horno', '🔥'), P('Lavadora', '🫧', 'Microondas', '📟'), P('Bañera', '🛁', 'Ducha', '🚿'),
      P('Váter', '🚽', 'Lavabo', '🚰'), P('Televisión', '📺', 'Ordenador', '💻'), P('Lámpara', '💡', 'Ventilador', '🌀'),
      P('Ventana', '🪟', 'Puerta', '🚪'), P('Escalera', '🪜', 'Ascensor', '🛗'), P('Cepillo de dientes', '🪥', 'Peine', '💇'),
      P('Sartén', '🍳', 'Olla', '🍲'), P('Espejo', '🪞', 'Cuadro', '🖼️'), P('Chimenea', '🔥', 'Radiador', '♨️')
    ]
  },
  naturaleza: {
    label: 'Naturaleza', emoji: '🌿',
    pairs: [
      P('Sol', '☀️', 'Luna', '🌙'), P('Nube', '☁️', 'Tormenta', '⛈️'), P('Árbol', '🌳', 'Cactus', '🌵'),
      P('Flor', '🌸', 'Seta', '🍄'), P('Arcoíris', '🌈', 'Puente', '🌉'), P('Copo de nieve', '❄️', 'Estrella', '⭐'),
      P('Tornado', '🌪️', 'Ola', '🌊'), P('Hoja', '🍃', 'Pluma', '🪶'), P('Hoguera', '🔥', 'Volcán', '🌋'),
      P('Girasol', '🌻', 'Tulipán', '🌷'), P('Cometa', '☄️', 'Planeta', '🪐'), P('Muñeco de nieve', '⛄', 'Espantapájaros', '🌾')
    ]
  },
  fantasia: {
    label: 'Fantasía', emoji: '🐉',
    pairs: [
      P('Dragón', '🐉', 'Dinosaurio', '🦖'), P('Unicornio', '🦄', 'Caballo con alas', '🐎'), P('Sirena', '🧜‍♀️', 'Pez payaso', '🐠'),
      P('Vampiro', '🧛', 'Murciélago', '🦇'), P('Fantasma', '👻', 'Momia', '🧟'), P('Bruja', '🧙‍♀️', 'Hada', '🧚'),
      P('Robot', '🤖', 'Extraterrestre', '👽'), P('Rey', '🤴', 'Caballero', '🛡️'), P('Princesa', '👸', 'Reina', '👑'),
      P('Genio de la lámpara', '🧞', 'Mago', '🪄'), P('Calabaza de Halloween', '🎃', 'Calavera', '💀'), P('Papá Noel', '🎅', 'Elfo', '🧝')
    ]
  },
  ropa: {
    label: 'Ropa', emoji: '👕',
    pairs: [
      P('Gorra', '🧢', 'Sombrero de copa', '🎩'), P('Camiseta', '👕', 'Vestido', '👗'), P('Zapatilla', '👟', 'Bota', '🥾'),
      P('Bufanda', '🧣', 'Corbata', '👔'), P('Guantes', '🧤', 'Calcetines', '🧦'), P('Bikini', '👙', 'Bañador', '🩳'),
      P('Corona', '👑', 'Casco', '⛑️'), P('Tacón', '👠', 'Chancla', '🩴'), P('Mochila', '🎒', 'Bolso', '👜'),
      P('Gafas de sol', '🕶️', 'Antifaz', '🎭')
    ]
  },
  musica: {
    label: 'Música y ocio', emoji: '🎸',
    pairs: [
      P('Guitarra', '🎸', 'Violín', '🎻'), P('Piano', '🎹', 'Acordeón', '🪗'), P('Trompeta', '🎺', 'Saxofón', '🎷'),
      P('Tambor', '🥁', 'Maracas', '🪇'), P('Micrófono', '🎤', 'Altavoz', '🔊'), P('Dados', '🎲', 'Cartas', '🃏'),
      P('Videoconsola', '🎮', 'Joystick', '🕹️'), P('Ajedrez', '♟️', 'Puzle', '🧩'), P('Cámara de cine', '🎥', 'Claqueta', '🎬'),
      P('Tarta de cumpleaños', '🎂', 'Piñata', '🪅')
    ]
  }
};

const PAIR_CATEGORY_KEYS = Object.keys(PAIR_CATEGORIES);
