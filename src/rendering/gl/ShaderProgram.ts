import {vec3, vec4, mat4, mat3} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number; // This time, it's an instanced rendering attribute, so each particle can have a unique color. Not per-vertex, but per-instance.
  attrTranslate: number; // Used in the vertex shader during instanced rendering to offset the vertex positions to the particle's drawn position.
  attrRotate: number;
  attrCol1: number;
  attrCol2: number;
  attrCol3: number;
  attrCol4: number;  
  attrUV: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifCameraAxes: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifTerrainType: WebGLUniformLocation;
  unifPopulationType: WebGLUniformLocation;
  unifSeaLevel: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrTranslate = gl.getAttribLocation(this.prog, "vs_Translate");
    this.attrRotate = gl.getAttribLocation(this.prog, "vs_Rotate");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");
    this.attrCol1 = gl.getAttribLocation(this.prog, "vs_Col1");
    this.attrCol2 = gl.getAttribLocation(this.prog, "vs_Col2");
    this.attrCol3 = gl.getAttribLocation(this.prog, "vs_Col3");
    this.attrCol4 = gl.getAttribLocation(this.prog, "vs_Col4");

    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifCameraAxes      = gl.getUniformLocation(this.prog, "u_CameraAxes");
    this.unifTime      = gl.getUniformLocation(this.prog, "u_Time");
    this.unifEye   = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef   = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp   = gl.getUniformLocation(this.prog, "u_Up");
    this.unifTerrainType = gl.getUniformLocation(this.prog, "u_TerrainType");
    this.unifPopulationType = gl.getUniformLocation(this.prog, "u_PopulationType");
    this.unifSeaLevel = gl.getUniformLocation(this.prog, "u_SeaLevel");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
    }
    if(this.unifRef !== -1) {
      gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
    }
    if(this.unifUp !== -1) {
      gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
    }
  }

  setDimensions(width: number, height: number) {
    this.use();
    if(this.unifDimensions !== -1) {
      gl.uniform2f(this.unifDimensions, width, height);
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setCameraAxes(axes: mat3) {
    this.use();
    if (this.unifCameraAxes !== -1) {
      gl.uniformMatrix3fv(this.unifCameraAxes, false, axes);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  setTerrainType(t: number) {
    this.use();
    if (this.unifTerrainType !== -1)
    {
      gl.uniform1i(this.unifTerrainType, t);
    }
  }

  setPopulationType(t: number) {
    this.use();
    if (this.unifPopulationType !== -1)
    {
      gl.uniform1i(this.unifPopulationType, t);
    }
  }

  setSeaLevel(t: number)
  {
    this.use();
    if (this.unifSeaLevel !== -1)
    {
      gl.uniform1f(this.unifSeaLevel, t);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrPos, 0); // Advance 1 index in pos VBO for each vertex
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrNor, 0); // Advance 1 index in nor VBO for each vertex
    }

    if (this.attrCol != -1 && d.bindCol()) {
      gl.enableVertexAttribArray(this.attrCol);
      gl.vertexAttribPointer(this.attrCol, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol, 0); // Advance 1 index in col VBO for each drawn instance
    }

    if (this.attrTranslate != -1 && d.bindTranslate()) {
      gl.enableVertexAttribArray(this.attrTranslate);
      gl.vertexAttribPointer(this.attrTranslate, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrTranslate, 1); // Advance 1 index in translate VBO for each drawn instance
    }

    if (this.attrRotate != -1 && d.bindRotate())
    {
      gl.enableVertexAttribArray(this.attrRotate);
      gl.vertexAttribPointer(this.attrRotate, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrRotate, 1);
    }

    if (this.attrUV != -1 && d.bindUV()) {
      gl.enableVertexAttribArray(this.attrUV);
      gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrUV, 0); // Advance 1 index in pos VBO for each vertex
    }

    if (this.attrCol1 != -1 && d.bindCol1()) {
      gl.enableVertexAttribArray(this.attrCol1);
      gl.vertexAttribPointer(this.attrCol1, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol1, 1); // Advance 1 index in col VBO for each drawn instance
    }

    if (this.attrCol2 != -1 && d.bindCol2()) {
      gl.enableVertexAttribArray(this.attrCol2);
      gl.vertexAttribPointer(this.attrCol2, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol2, 1); // Advance 1 index in col VBO for each drawn instance
    }


    if (this.attrCol3 != -1 && d.bindCol3()) {
      gl.enableVertexAttribArray(this.attrCol3);
      gl.vertexAttribPointer(this.attrCol3, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol3, 1); // Advance 1 index in col VBO for each drawn instance
    }

    if (this.attrCol4 != -1 && d.bindCol4()) {
      gl.enableVertexAttribArray(this.attrCol4);
      gl.vertexAttribPointer(this.attrCol4, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol4, 1); // Advance 1 index in col VBO for each drawn instance
    }

    // TODO: Set up attribute data for additional instanced rendering data as needed

    d.bindIdx();
    // drawElementsInstanced uses the vertexAttribDivisor for each "in" variable to
    // determine how to link it to each drawn instance of the bound VBO.
    // For example, the index used to look in the VBO associated with
    // vs_Pos (attrPos) is advanced by 1 for each thread of the GPU running the
    // vertex shader since its divisor is 0.
    // On the other hand, the index used to look in the VBO associated with
    // vs_Translate (attrTranslate) is advanced by 1 only when the next instance
    // of our drawn object (in the base code example, the square) is processed
    // by the GPU, thus being the same value for the first set of four vertices,
    // then advancing to a new value for the next four, then the next four, and
    // so on.
    gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, d.numInstances);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrCol != -1) gl.disableVertexAttribArray(this.attrCol);
    if (this.attrTranslate != -1) gl.disableVertexAttribArray(this.attrTranslate);
    if (this.attrRotate != -1) gl.disableVertexAttribArray(this.attrRotate);
    if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
    if (this.attrCol1 != -1) gl.disableVertexAttribArray(this.attrCol1);
    if (this.attrCol2 != -1) gl.disableVertexAttribArray(this.attrCol2);
    if (this.attrCol3 != -1) gl.disableVertexAttribArray(this.attrCol3);
    if (this.attrCol4 != -1) gl.disableVertexAttribArray(this.attrCol4);
  }
};

export default ShaderProgram;
