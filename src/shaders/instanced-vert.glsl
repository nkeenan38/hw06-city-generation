#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene
uniform mat4 u_ViewProj;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col1;
in vec4 vs_Col2;
in vec4 vs_Col3;
in vec4 vs_Col4;

out vec4 fs_Pos;
out vec3 fs_Col;

void main() {
  mat4 T = mat4(vs_Col1, vs_Col2, vs_Col3, vs_Col4);
  fs_Pos = T * vs_Pos; 
  fs_Col = vec3(vs_Nor.xyz);
  gl_Position = u_ViewProj * T * vs_Pos;
}
