const cvs = document.getElementById("myCanvas");

let fps = 15;
let cols = 5; // minimum 5 columns use
let rows = cols % 2 ? cols + 2 : cols + 3;
let mines = 1;
let scale = 1;

const min = Math.min(window.innerWidth, window.innerHeight);
let size = Math.floor(min / (cols + 1));

const imgs = {
   boom: new Image(),
   flag: new Image()
}
imgs.boom.src = "../src/img/explosions.png";
imgs.flag.src = "../src/img/flag.png";

const mp3 = {
   bg: $("audio_bg"),
   boom: $("audio_boom"),
   gameOver: $("audio_game_over"),
   show: $("audio_show"),
   win: $("audio_win")
}

const ani = new Animation(fps, animate);
let game = new Game(rows, cols, size, mines, scale, cvs, imgs, mp3);

function animate() {
   game.update();
   game.draw();
}
ani.start();
