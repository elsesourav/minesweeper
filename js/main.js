const cvs = document.getElementById("myCanvas");
if (isMobile) {
   document.body.classList.add("mobile");
}

const localKey = "___S_B__Minesweeper___";
const maps = [5, 7, 10, 14];
const deff = [1, 2, 3]
let fps = 15;
let cols = 5;
let rows = cols % 2 ? cols + 2 : cols + 3;
let selectDeffIndex = 0;
let mapSizeIndex = 0;
let musicVolume = 1;
let effectVolume = 1;

const imgs = {
   boom: imgBoom,
   flag: imgFlag
}

const mp3 = {
   bg: $("audio_bg"),
   boom: $("audio_boom"),
   flag: $("audio_flag"),
   gameOver: $("audio_game_over"),
   show: $("audio_show"),
   win: $("audio_win")
}

// set and localStorage values
if (localStorage.getItem(localKey) === null) {
   updateLocalValues();
} else {
   const loclaValues = getDataFromLocalStorage(localKey);
   cols = loclaValues.cols;
   effectVolume = loclaValues.effectVolume;
   musicVolume = loclaValues.musicVolume;
   rows = loclaValues.rows;
   selectDeffIndex = loclaValues.selectDeffIndex;
   mapSizeIndex = loclaValues.mapSizeIndex;

   musicInput.value = musicVolume;
   effectInput.value = effectVolume;
   mapSize.selectedIndex = mapSizeIndex;
   difficulty.selectedIndex = selectDeffIndex;
}

function updateLocalValues() {
   setDataFromLocalStorage(localKey, {
      musicVolume: musicVolume,
      effectVolume: effectVolume,
      selectDeffIndex: selectDeffIndex,
      mapSizeIndex: mapSizeIndex,
      rows: rows,
      cols: cols
   });
}

let mines = Math.round(cols * deff[selectDeffIndex] * (1 + mapSizeIndex / 2));
const min = Math.min(window.innerWidth, window.innerHeight);
let size = window.innerWidth > window.innerHeight ?
   Math.floor(min / (rows + 1)) : Math.floor(min / (cols + 1));


const ani = new Animation(fps, animate);
let game = new Game(rows, cols, size, mines, cvs, imgs, mp3);

game.setMusicVolume(musicVolume);
game.setEffectVolume(musicVolume);

function animate() {
   game.update();
   game.draw();
}
ani.start();

restart.addEventListener("click", () => {
   game.reset();
})


let settingIsOpen = false;
icon.addEventListener("click", () => {
   settingIsOpen = !settingIsOpen;
   setting.classList.toggle("active", settingIsOpen);
   if (settingIsOpen) setting.classList.add("show");
   else setTimeout(() => setting.classList.remove("show"), 200);
})
window.addEventListener("click", () => game.playBGaudio(), { once: true })

musicInput.addEventListener("change", (e) => {
   const value = Number(e.target.value);
   game.setMusicVolume(musicVolume = value);
   updateLocalValues();
});

effectInput.addEventListener("change", (e) => {
   const value = Number(e.target.value);
   game.setEffectVolume(effectVolume = value);
   updateLocalValues();
});

mapSize.addEventListener("change", (e) => {
   const value = Number(e.target.value);
   cols = maps[mapSizeIndex = value];
   rows = cols % 2 ? cols + 2 : cols + 3;

   const min = Math.min(window.innerWidth, window.innerHeight);
   size = window.innerWidth > window.innerHeight ?
      Math.floor(min / (rows + 1)) : Math.floor(min / (cols + 1));
   console.log(mapSizeIndex);

   mines = Math.floor(cols * deff[selectDeffIndex] * (1 + mapSizeIndex / 2));
   game.reset(rows, cols, size, mines);
   updateLocalValues();
});

difficulty.addEventListener("change", (e) => {
   const value = Number(e.target.value);
   mines = Math.round(cols * deff[selectDeffIndex = value] * (1 + mapSizeIndex / 2));
   game.reset(rows, cols, size, mines);
   updateLocalValues();
});
