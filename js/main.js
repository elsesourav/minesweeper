const cvs = document.getElementById("myCanvas");
if (isMobile) {
   document.body.classList.add("mobile");
}

let fps = 15;
let cols = 5; // minimum 5 columns use
let rows = cols % 2 ? cols + 2 : cols + 3;
let mines = 2;

const min = Math.min(window.innerWidth, window.innerHeight);
let size = window.innerWidth > window.innerHeight ? 
            Math.floor(min / (rows + 1)) : Math.floor(min / (cols + 1));

const imgs = {
   boom: new Image(),
   flag: new Image()
}
imgs.boom.src = "../src/img/explosions.png";
imgs.flag.src = "../src/img/flag.png";

const mp3 = {
   bg: $("audio_bg"),
   boom: $("audio_boom"),
   flag: $("audio_flag"),
   gameOver: $("audio_game_over"),
   show: $("audio_show"),
   win: $("audio_win")
}

const ani = new Animation(fps, animate);
let game = new Game(rows, cols, size, mines, cvs, imgs, mp3);

function animate() {
   game.update();
   game.draw();
}
ani.start();

restart.addEventListener("click", () => {
   game.reset();
})

setting.addEventListener("click", () => {
   setting.classList.toggle("active");
})
window.addEventListener("click", () => {
game.playBGaudio();
}, { once: true })