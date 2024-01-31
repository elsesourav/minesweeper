class Game {
   constructor(rows, cols, size, mine, cvs, imgs, mp3) {
      this.rows = rows;
      this.cols = cols;
      this.size = size;
      this.mine = mine;
      this.cvs = cvs;
      this.imgs = imgs;
      this.mp3 = mp3;
      this.c = cvs.getContext("2d");

      this.grid = [];
      this.showCells = [];
      this.nextNeighborQueue = [];
      this.#eventHandler();
      this.#setup();

      this.regex = {
         even: [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]],
         odd: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]
      }
      this.fpsCount = 0;
      this.isGameOver = false;
      this.isFirstClick = true;
      this.timer = 0;
      this.flagCont = this.mine;
      this.intervalID;
   }

   #setup() {
      clearInterval(this.intervalID);
      this.showCells = [];
      this.nextNeighborQueue = [];
      this.flagCont = this.mine;
      this.width = this.cols * this.size + this.size;
      this.height = (this.rows - 1) * this.size + this.size;
      this.isGameOver = false;
      this.isFirstClick = true;

      cvs.width = this.width;
      cvs.height = this.height;
      cvs.style.width = `${this.width}px`;
      cvs.style.height = `${this.height}px`;
      this.c.lineCap = "round";
      this.c.lineJoin = "round";
      this.c.shadowBlur = this.size / 12;
      this.c.lineWidth = this.size / 20;
      this.c.imageSmoothingEnabled = false;
      timeBox.innerText = "000";
      timeBox.style.color = "white";
      flagCoutn.innerText = this.mine;
      moveFlag.style.width = `${this.size / 1.8}px`;
      moveFlag.style.height = `${this.size / 1.8}px`;
      this.#setPoints();
      this.#setEmojiStatus("normal");
   }

   #setPoints() {
      const { cols, rows, size } = this;
      this.grid = [];

      for (let y = 0; y < rows; y++) {
         this.grid[y] = [];
         const _cols = y % 2 ? cols - 1 : cols;
         const offx = y % 2 ? 0.5 : 0;

         for (let x = 0; x < _cols; x++) {
            this.grid[y][x] = new Cell(x + offx, y, size / 2, x, y, this.imgs.flag);
         }
      }
   }

   #setupNeighbors(skipCells) {
      this.#startTimer();
      const { cols, rows } = this;
      // select random mine x, y in new array
      const randomMines = [];
      while (randomMines.length < this.mine) {
         const y = Math.floor(Math.random() * this.rows);
         const cols = y % 2 ? this.cols - 1 : this.cols;
         const x = Math.floor(Math.random() * cols);

         if (!randomMines.some(([X, Y]) => x == X && y == Y)
            && !skipCells.some(([X, Y]) => x == X && y == Y)) {
            randomMines.push([x, y]);
         }
      }

      // apply array x, y in grid 
      randomMines.forEach(([x, y]) => {
         this.grid[y][x].mine = true;
         this.grid[y][x].imgBoom = this.imgs.boom;
         // this.grid[y][x].imgFlag = this.imgs.flag;
      });

      // calculate neighbors mine of each cell
      for (let y = 0; y < rows; y++) {
         const _cols = y % 2 ? cols - 1 : cols;
         for (let x = 0; x < _cols; x++) {

            const name = y % 2 ? "odd" : "even";
            let sum = 0;
            this.regex[name].forEach(([X, Y]) => {
               if (this.#validIndexs(y + Y, x + X)
                  && this.grid[y + Y][x + X].mine
               ) {
                  sum++;
               }
            });
            this.grid[y][x].neighbors = sum;
         }
      }
   }

   #showNeighbors(j, i) {
      const name = j % 2 ? "odd" : "even";
      this.regex[name].forEach(([X, Y]) => {
         if (this.#validIndexs(j + Y, i + X) && !this.grid[j + Y][X + i].open) {
            this.grid[j + Y][X + i].open = true;
            this.showCells.push(this.grid[j + Y][X + i]);

            if (this.grid[j + Y][X + i].neighbors === 0) {
               this.nextNeighborQueue.push([Y + j, X + i]);
            }
         }
      });
      if (this.nextNeighborQueue.length > 0) {
         const [y, x] = this.nextNeighborQueue.shift();
         this.#showNeighbors(y, x);
      } else if (!this.isGameOver && this.mine >= this.#notOpenCellSum()) {
         this.#gameWin();
      }
   }

   #inputSetFlag(x, y) {
      this.grid.some(cols => cols.some(cell => {
         if (pointInCircle(cell, x, y) && !cell.showFlag) {
            cell.showFlag = true;
            this.#playFlagAudio()
            flagCoutn.innerText = --this.flagCont;
         }
      }));
   }

   #inputsAction(x, y, isHover = false) {
      this.grid.some(cols => cols.some(cell => {
         if (pointInCircle(cell, x, y)) {

            if (!isHover && this.isFirstClick) {
               const { i, j } = cell;
               this.isFirstClick = false;
               const skipCells = [[i, j]];
               const name = j % 2 ? "odd" : "even";
               this.regex[name].forEach(([x, y]) => {
                  skipCells.push([i + x, j + y]);
               });
               this.#setupNeighbors(skipCells);
            } else {
               this.grid.forEach(_ => _.forEach(c => c.hover = false));
            }
            // false every cell hover value 
            if (!this.grid[cell.j][cell.i].open) {
               if (isHover) {
                  cell.hover = true;
               } else {
                  const { j, i, neighbors, mine } = cell;
                  cell.open = true;

                  if (mine) {
                     // GAME OVER
                     this.#gameOver();
                     clearInterval(this.intervalID);
                     this.#setEmojiStatus("over");
                     return true;
                  } else if (neighbors === 0) {
                     this.showCells.push(cell);
                     this.#showNeighbors(j, i);
                  } else {
                     this.showCells.push(cell);
                  }

                  // for emoji changes
                  if (!mine) {
                     this.#setEmojiStatus("safe", true);
                  }

                  // WIN GAME
                  if (!this.isGameOver && this.mine >= this.#notOpenCellSum()) {
                     this.#gameWin();
                     this.#setEmojiStatus("win");
                     clearInterval(this.intervalID);
                     setTimeout(() => this.#setEmojiStatus("win"), 2400);
                  }
               }

            }
            return true;
         }
      }));
   }

   #eventHandler() {
      let isDown = false, lx, ly;
      this.cvs.addEventListener("click", (e) => {
         const { top, left } = this.cvs.getBoundingClientRect();
         this.#inputsAction(e.clientX - left, e.clientY - top)
      })
      this.cvs.addEventListener("mousemove", (e) => {
         const { top, left } = this.cvs.getBoundingClientRect();
         this.#inputsAction(e.clientX - left, e.clientY - top, true)
      })

      const down = (e) => {
         if (this.flagCont > 0) {
            if (e.type == "touchstart") e = e.touches[0];
            moveFlag.style.left = `${e.clientX - this.size / 4}px`;
            moveFlag.style.top = `${e.clientY - this.size / 4}px`;
            isDown = true;
            moveFlag.style.opacity = 1;
         }
      }
      const move = (e) => {
         if (e.type == "touchmove") e = e.touches[0];
         lx = e.clientX;
         ly = e.clientY;

         if (isDown) {
            moveFlag.style.left = `${lx - this.size / 4}px`;
            moveFlag.style.top = `${ly - this.size / 4}px`;
         }
      }
      const end = () => {
         if (isDown) {
            isDown = false;
            moveFlag.style.opacity = 0;
            moveFlag.style.left = 0;
            moveFlag.style.top = 0;
            const { top, left } = this.cvs.getBoundingClientRect();
            this.#inputSetFlag(lx - left, ly - top);
         }
      }


      flagBox.addEventListener("mousedown", down);
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      flagBox.addEventListener("touchstart", down);
      window.addEventListener("touchmove", move);
      window.addEventListener("touchend", end);
   }

   draw() {
      this.c.clearRect(0, 0, this.width, this.height);
      this.grid.forEach((cols) => cols.forEach((e) => {
         e.draw(this.c);
      }));
      this.grid.some((cols) => cols.some((e) => {
         if (e.hover) {
            e.drawHover(this.c);
            return true;
         }
      }));
   }

   update() {
      this.fpsCount++;
      if (this.showCells.length > 0) {
         const cell = this.showCells.shift();
         if (cell.showFlag) {
            flagCoutn.innerText = ++this.flagCont;
         }
         cell.show = true;
         this.mp3.show.currentTime = 0;
         this.mp3.show.play();
      }
   }

   #startTimer() {
      this.timer = 0;
      this.intervalID = setInterval(() => {
         // __fps.innerHTML = "FPS: " + this.fpsCount;
         // this.fpsCount = 0;
         this.timer++;
         if (this.timer > 998) {
            this.#gameOver();
            clearInterval(this.intervalID);
            this.#setEmojiStatus("over");
            timeBox.style.color = "red";
         }
         timeBox.innerText = this.timer > 99 ? this.timer
            : this.timer > 9 ? `0${this.timer}` : `00${this.timer}`;

      }, 1000);
   }

   #setEmojiStatus(className, is = false) {
      emoji.classList = [];
      emoji.classList.add(className);

      if (is) {
         setTimeout(() => {
            emoji.classList = [];
            emoji.classList.add("normal");
         }, 2400);
      }
   }

   #notOpenCellSum() {
      return this.grid.reduce((acc, cols) => cols.filter(c => !c.open).length + acc, 0);
   }

   #validIndexs(y, x) {
      return y > -1 && y < this.rows && x > -1 && x < this.grid[y].length;
   }

   #gameOver() {
      this.isGameOver = true;
      this.mp3.boom.play();
      this.grid.forEach(_ => _.forEach(c => {
         if (c.mine) c.show = true;
         else c.open = true;
      }));
      setTimeout(() => {
         this.mp3.gameOver.play();
      }, 3000);
   }

   #gameWin() {
      this.grid.forEach(_ => _.forEach(c => c.open = true));
      setTimeout(() => {
         this.mp3.win.play();
      }, 500);
   }

   reset(rows = this.rows, cols = this.cols, size = this.size, mine = this.mine) {
      this.rows = rows;
      this.cols = cols;
      this.size = size;
      this.mine = mine;
      this.#setup();
   }

   pauseBGaudio() {
      this.mp3.bg.pause();
   }

   playBGaudio() {
      this.mp3.bg.loop = true;
      this.mp3.bg.play();
   }

   setMusicVolume(volume) {
      this.mp3.bg.volume = volume;
   }
   
   setEffectVolume(volume) {
      this.mp3.boom.volume = volume;
      this.mp3.flag.volume = volume;
      this.mp3.gameOver.volume = volume;
      this.mp3.show.volume = volume;
      this.mp3.win.volume = volume;
   }

   #playFlagAudio() {
      this.mp3.flag.currentTime = 0;
      this.mp3.flag.play();
   }

}