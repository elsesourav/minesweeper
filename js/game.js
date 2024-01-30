class Game {
   constructor(rows, cols, size, mine, scale, cvs, imgs, mp3) {
      this.rows = rows;
      this.cols = cols;
      this.scale = scale;
      this.size = size * this.scale;
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

      this.fpsCount = 0;
      // this.#showFPS();
      this.start = false;
   }

   #showFPS() {
      setInterval(() => {
         __fps.innerHTML = "FPS: " + this.fpsCount;
         this.fpsCount = 0;
      }, 1000);
   }

   #setup() {
      this.showCells = [];
      this.nextNeighborQueue = [];
      this.width = this.cols * this.size + this.size;
      this.height = (this.rows - 1) * this.size + this.size;
      cvs.width = this.width;
      cvs.height = this.height;
      cvs.style.width = `${this.width / this.scale}px`;
      cvs.style.height = `${this.height / this.scale}px`;
      this.c.lineCap = "round";
      this.c.lineJoin = "round";
      this.c.shadowBlur = this.size / 12;
      this.c.lineWidth = this.size / 20;
      // this.c.imageSmoothingEnabled = false;
      this.#setPoints();
   }

   #setPoints() {
      const { cols, rows, size } = this;
      this.grid = [];

      for (let y = 0; y < rows; y++) {
         this.grid[y] = [];
         const _cols = y % 2 ? cols - 1 : cols;
         const offx = y % 2 ? 0.5 : 0;

         for (let x = 0; x < _cols; x++) {
            this.grid[y][x] = new Cell(x + offx, y, size / 2, x, y);
         }
      }

      // select random mine x, y in new array
      const randomMines = [];
      while (randomMines.length < this.mine) {
         const y = Math.floor(Math.random() * this.rows);
         const cols = y % 2 ? this.cols - 1 : this.cols;
         const x = Math.floor(Math.random() * cols);

         if (!randomMines.some(([X, Y]) => x == X && y == Y)) {
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
      this.regex = {
         even: [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]],
         odd: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]
      }

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
      } else if (this.mine >= this.#notOpenCellSum()) {
         this.#gameWin();
      }
   }

   #inputsAction(x, y, isHover = false) {
      x = x * this.scale;
      y = y * this.scale;
      this.grid.some(cols => cols.some(cell => {
         if (pointInCircle(cell, x, y)) {
            // false every cell hover value 
            this.grid.forEach(_ => _.forEach(c => c.hover = false));
            if (!this.grid[cell.j][cell.i].open) {
               if (isHover) {
                  cell.hover = true;
               } else {
                  const { j, i, neighbors, mine } = cell;
                  cell.open = true;

                  if (mine) {
                     // GAME OVER
                     this.#gameOver();
                  } else if (neighbors === 0) {
                     this.showCells.push(cell);
                     this.#showNeighbors(j, i);
                  } else {
                     this.showCells.push(cell);
                  }

                  // WIN GAME
                  if (this.mine >= this.#notOpenCellSum()) {
                     this.#gameWin();
                  }
               }

            }
            return true;
         }
      }));
   }

   #notOpenCellSum() {
      return this.grid.reduce((acc, cols) => cols.filter(c => !c.open).length + acc, 0);
   }

   #eventHandler() {
      this.cvs.addEventListener("click", (e) => {
         const { top, left } = this.cvs.getBoundingClientRect();
         this.#inputsAction(e.clientX - left, e.clientY - top)
         if (!this.start) {
            this.start = true;
            this.playBGaudio();
         }
      })
      this.cvs.addEventListener("mousemove", (e) => {
         const { top, left } = this.cvs.getBoundingClientRect();
         this.#inputsAction(e.clientX - left, e.clientY - top, true)
      })
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
         cell.show = true;
         this.mp3.show.currentTime = 0;
         this.mp3.show.play();
      }
   }


   #validIndexs(y, x) {
      return y > -1 && y < this.rows && x > -1 && x < this.grid[y].length;
   }

   #gameOver() {
      this.mp3.boom.play();
      this.grid.forEach(_ => _.forEach(c => { if (c.mine) c.show = true }));
      setTimeout(() => {
         this.mp3.gameOver.play();
      }, 3000);
   }

   #gameWin() {
      setTimeout(() => {
         this.mp3.win.play();
      }, 500);
   }

   reset(rows, cols, size, mine) {
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
      this.mp3.bg.volume = 0.1;
      this.mp3.bg.loop = true;
      this.mp3.bg.play();
   }

}