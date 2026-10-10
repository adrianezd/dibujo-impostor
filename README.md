# Dibujo Impostor

Juego de fiesta de dibujo para grupos, hecho con HTML, CSS y JavaScript puros (sin frameworks, sin build, sin backend). Se juega pasando un solo móvil entre todos los jugadores, y funciona sin internet tras la primera visita.

**Juega aquí:** https://adrianezd.github.io/dibujo-impostor/

## Modos de juego

| Modo | Qué pasa |
| --- | --- |
| 🎭 **Concepto parecido** | El impostor recibe un concepto parecido («Helicóptero» en vez de «Avión») y no sabe que es el impostor. |
| 🙈 **A ciegas** | El impostor sabe que lo es y solo conoce la categoría. Todos dibujan en papel. |
| 🖌️ **Lienzo compartido** | Un único dibujo en el móvil: por turnos, cada jugador añade un trazo con su color (1 a 3 vueltas). Al final se puede guardar el dibujo. |

## Funcionalidades

- Más de 150 parejas de conceptos en 12 categorías, con selección múltiple.
- Nombres de jugadores (compartidos con ¿Quién es el Impostor? y El Dato Falso).
- Carta que se gira manteniendo pulsado para ver el concepto en privado.
- Cronómetro de dibujo con anillo, sonido y vibración.
- Votación a mano alzada o secreta, última oportunidad del impostor y marcador entre rondas.
- Pantalla siempre encendida durante la partida y modo sin conexión (service worker).

## Con código de sala

Además de pasarse un móvil, se puede jugar **cada uno con el suyo**. En los ajustes, la pestaña «Con código de sala»:

1. Uno pone su nombre y pulsa **Crear sala**: sale un código de 5 letras (y un botón para compartir el enlace, que ya lleva el código).
2. El resto pone su nombre y el código y pulsa **Unirse**.
3. Quien creó la sala la configura con los ajustes normales del juego (modo, categorías, impostores, tiempo…) y también juega. Los jugadores son los que han entrado.
4. En cada ronda, cada uno ve su carta en su móvil manteniendo pulsado, se vota desde cada móvil y al revelar todos ven el resultado.

El modo «Lienzo compartido» no está en la sala, porque se dibuja en un solo móvil.

Los móviles se comunican a través de [ntfy.sh](https://ntfy.sh) (servicio gratuito de mensajes, sin cuentas), un canal por sala, sin que los mensajes se guarden en el servidor. En este modo hace falta internet. La lógica está en `sala.js` y `sala.css`, iguales en los tres juegos de fiesta.

## Puntuación

- El grupo expulsa a todos los impostores (y no adivinan el concepto) → **+1** a cada jugador del grupo.
- Algún impostor se libra o adivina el concepto → **+2** a cada impostor.

## Transparencia

Los pares de conceptos son contenido original de este proyecto, sin relación con ninguna obra registrada. Proyecto original, no afiliado a ninguna marca comercial.
