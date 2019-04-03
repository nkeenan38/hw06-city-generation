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

    this.indices = new Uint32Array([0, 1, 2,  // bottom
                                    0, 2, 3,
                                    4, 5, 6,  // top
                                    4, 6, 7,
                                    8, 9, 10,  // back
                                    8, 10, 11, 
                                    12, 13, 14,  // right
                                    12, 14, 15,
                                    16, 17, 18,    // front
                                    16, 18, 19,
                                    20, 21, 22,  // left
                                    20, 22, 23]);
    this.positions = new Float32Array([-this.width/2, -this.width/2, 0, 1,          // 0
                                       this.width/2, -this.width/2, 0, 1,           // 1 
                                       this.width/2, this.width/2, 0, 1,            // 2
                                       -this.width/2, this.width/2, 0, 1,           // 3

                                       -this.width/2, -this.width/2, this.height, 1,// 4
                                       this.width/2, -this.width/2, this.height, 1, // 5
                                       this.width/2, this.width/2, this.height, 1,  // 6
                                       -this.width/2, this.width/2, this.height, 1, // 7

                                       -this.width/2, -this.width/2, 0, 1,          // 8
                                       -this.width/2, -this.width/2, this.height, 1,// 9
                                       this.width/2, -this.width/2, this.height, 1, // 10
                                       this.width/2, -this.width/2, 0, 1,           // 11
                                       
                                       this.width/2, -this.width/2, 0, 1,           // 12 
                                       this.width/2, -this.width/2, this.height, 1, // 13
                                       this.width/2, this.width/2, this.height, 1,  // 14
                                       this.width/2, this.width/2, 0, 1,            // 15

                                       this.width/2, this.width/2, 0, 1,            // 16
                                       this.width/2, this.width/2, this.height, 1,  // 17
                                       -this.width/2, this.width/2, this.height, 1, // 18
                                       -this.width/2, this.width/2, 0, 1,           // 19

                                       -this.width/2, this.width/2, 0, 1,           // 20
                                       -this.width/2, this.width/2, this.height, 1, // 21
                                       -this.width/2, -this.width/2, this.height, 1,// 22
                                       -this.width/2, -this.width/2, 0, 1           // 23
                                       ]);      
    this.normals = new Float32Array([0, 0, -1, 0,
                                     0, 0, -1, 0,
                                     0, 0, -1, 0,
                                     0, 0, -1, 0,
                                     0, 0, 1, 0,
                                     0, 0, 1, 0,
                                     0, 0, 1, 0,
                                     0, 0, 1, 0,
                                     0, -1, 0, 0,
                                     0, -1, 0, 0,
                                     0, -1, 0, 0,
                                     0, -1, 0, 0,
                                     1, 0, 0, 0,
                                     1, 0, 0, 0,
                                     1, 0, 0, 0,
                                     1, 0, 0, 0,
                                     0, 1, 0, 0,
                                     0, 1, 0, 0,
                                     0, 1, 0, 0,
                                     0, 1, 0, 0,
                                     -1, 0, 0, 0,
                                     -1, 0, 0, 0,
                                     -1, 0, 0, 0,
                                     -1, 0, 0, 0])

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
