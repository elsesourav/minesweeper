class Cell {
   constructor(x, y, size, i, j) {
      this.i = i;
      this.j = j;
      this.x = x * size * 2 + size * 2;
      this.y = (y * size * 2 + size * 1.8) - (j * size * 0.27);
      this.size = size;
      this.sides = [];
      this.neighbors = 0;
      this.mine = false;
      this.open = false;
      this.show = false;
      this.hover = false;
      this.isFlag = false;
      this.hexPath = new Path2D();
      this.#createHexagon();
      this.imgBoom;
      this.imgFlag;
      this.count = 0;
   }

   #createHexagon() {
      for (var i = 0; i <= 6; i++) {
         const [offx, offy] = hexPointByAngle(i, this.size * 1.146);
         this.hexPath.lineTo(this.x + offx, this.y + offy);
         this.sides.push([this.x + offx, this.y + offy]);
      }
   }

   #drawText(c, text, x, y, fontSize, color = "#000") {
      c.fillStyle = color;
      c.font = `bold ${fontSize * this.size / 20}px Arial`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.strokeStyle = "#0004";
      c.fillText(text, x, y);
      c.strokeText(text, x, y);
   }

   drawHover(c) {
      c.strokeStyle = this.hover ? "#0ff" : "#000";
      c.shadowColor = "#0ff";
      c.stroke(this.hexPath);
   }

   draw(c) {
      if (this.show) {
         c.fillStyle = this.mine ? "#f00a" : this.neighbors > 0 ? "#f71aff" : "#56ff46";
      } else {
         c.fillStyle = "#ddd";
      }
      c.strokeStyle = "#000";
      c.shadowColor = "#0ff";
      c.fill(this.hexPath);
      c.stroke(this.hexPath);

      if (this.mine) {
         if (this.show) {
            if (this.count++ > 20) this.count = 0;
   
            c.drawImage(this.imgBoom,
               this.count * 300,
               0, 300, 302,
               this.x - this.size,
               this.y - this.size,
               this.size * 2,
               this.size * 2,
            );
         } else if (this.isFlag){
            c.drawImage(this.imgFlag,
               0, 0, 64, 64,
               this.x - this.size / 2,
               this.y - this.size / 2,
               this.size,
               this.size,
            );
         }
      } else if (this.show && this.neighbors > 0) {
         c.shadowColor = "#0000";
         this.textColor = this.color = `hsl(${map(this.neighbors, 1, 6, 90, 360)}, 100%, 60%)`;
         this.#drawText(c, this.neighbors, this.x, this.y, 25, this.textColor);
      }
   }
}