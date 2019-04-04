import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Prism extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  offsets: Float32Array; // Data for bufTranslate

  height: number;  // height of the prism
  width: number;   // width of each side
  sides: number;   // number of sides


  constructor(height: number, width: number, sides: number) {
    super(); // Call the constructor of the super class. This is required.
    this.height = height;
    this.width = width;
    this.sides = sides;
  }

  create() {
    let angle = 2 * Math.PI / this.sides;
    let offset = Math.PI / this.sides;
    let bottom : vec4[] = [];
    let top : vec4[] = [];
    // create the position values for the bottom 
    for (let n = 0; n < this.sides; n++)
    {
      bottom.push(vec4.fromValues(this.width * Math.cos(n * angle + offset),
                                  this.width * Math.sin(n * angle + offset),
                                  0, 1));
      top.push(vec4.fromValues(this.width * Math.cos(n * angle + offset),
                               this.width * Math.sin(n * angle + offset),
                               this.height, 1));
    }
    let positions : number[] = [];
    let indexes : number[] = [];
    let normals : number[] = []
    // fan sides
    positions.push(bottom[0][0], bottom[0][1], bottom[0][2], bottom[0][3]);
    positions.push(top[0][0], top[0][1], top[0][2], top[0][3]);  
    normals.push(Math.cos(offset), Math.sin(offset), 0, 0);
    normals.push(Math.cos(offset), Math.sin(offset), 0, 0);       
    for (let n = 0; n < this.sides - 1; n++)
    {
      positions.push(bottom[n+1][0], bottom[n+1][1], bottom[n+1][2], bottom[n+1][3]);
      positions.push(top[n+1][0], top[n+1][1], top[n+1][2], top[n+1][3]); 
      let i = n * 2;
      indexes.push(i, i+1, i+3, i, i+3, i+2);
      // indexes.push(n, n+1, n+3, n, n+3, n+2);
      normals.push(Math.cos(n * angle + offset), Math.sin(n * angle + offset), 0, 0);
      normals.push(Math.cos(n * angle + offset), Math.sin(n * angle + offset), 0, 0);
    }
    // fan bottom
    let firstIdx = positions.length / 4;
    positions.push(bottom[0][0], bottom[0][1], bottom[0][2], bottom[0][3]);
    positions.push(bottom[1][0], bottom[1][1], bottom[1][2], bottom[1][3]);
    normals.push(0, 0, -1, 0, 0, 0, -1, 0);
    for (let n = 0; n + 2 < this.sides; n++)
    {
       indexes.push(firstIdx, firstIdx+n+1, firstIdx+n+2); 
       positions.push(bottom[n+2][0], bottom[n+2][1], bottom[n+2][2], bottom[n+2][3]);  // n + 2
       normals.push(0, 0, -1, 0);
    }
    // fan top
    firstIdx = positions.length / 4;
    positions.push(top[0][0], top[0][1], top[0][2], top[0][3]);
    positions.push(top[1][0], top[1][1], top[1][2], top[1][3]);
    normals.push(0, 0, 1, 0, 0, 0, 1, 0);
    for (let n = 0; n + 2 < this.sides; n++)
    {
       indexes.push(firstIdx, firstIdx+n+1, firstIdx+n+2); 
       positions.push(top[n+2][0], top[n+2][1], top[n+2][2], top[n+2][3]);  // n + 2
       normals.push(0, 0, 1, 0);
    }
    // handle last case
    let idx = positions.length / 4;
    indexes.push(idx, idx+1, idx+3, idx, idx+3, idx+2);

    positions.push(bottom[this.sides-1][0], bottom[this.sides-1][1], bottom[this.sides-1][2], bottom[this.sides-1][3]);
    positions.push(top[this.sides-1][0], top[this.sides-1][1], top[this.sides-1][2], top[this.sides-1][3]);
    positions.push(bottom[0][0], bottom[0][1], bottom[0][2], bottom[0][3]);
    positions.push(top[0][0], top[0][1], top[0][2], top[0][3]);

    normals.push(Math.cos((this.sides - 1) * angle + offset), Math.sin((this.sides - 1) * angle + offset), 0, 0);
    normals.push(Math.cos((this.sides - 1) * angle + offset), Math.sin((this.sides - 1) * angle + offset), 0, 0); 
    normals.push(Math.cos((this.sides - 1) * angle + offset), Math.sin((this.sides - 1) * angle + offset), 0, 0);
    normals.push(Math.cos((this.sides - 1) * angle + offset), Math.sin((this.sides - 1) * angle + offset), 0, 0); 

    this.indices = new Uint32Array(indexes);
    this.positions = new Float32Array(positions);
    this.normals = new Float32Array(normals);

    this.generateIdx();
    this.generatePos();
    this.generateCol();
    this.generateNor();
    this.generateColumns();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    console.log(`Created Prism`);
  }

  setInstanceVBOs(col1: Float32Array, col2: Float32Array, col3: Float32Array, col4: Float32Array) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol1);
    gl.bufferData(gl.ARRAY_BUFFER, col1, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol2);
    gl.bufferData(gl.ARRAY_BUFFER, col2, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol3);
    gl.bufferData(gl.ARRAY_BUFFER, col3, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol4);
    gl.bufferData(gl.ARRAY_BUFFER, col4, gl.STATIC_DRAW);
  }
};

export default Prism;
