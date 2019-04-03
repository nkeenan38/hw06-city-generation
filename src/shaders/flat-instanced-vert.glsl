#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene
uniform mat4 u_ViewProj;

in vec4 vs_Pos;
in vec4 vs_Col1;
in vec4 vs_Col2;
in vec4 vs_Col3;
in vec4 vs_Col4;

out vec4 fs_Pos;
out vec3 fs_Col;

void main() {
  mat4 T = mat4(vec4(vs_Col1), vec4(vs_Col2), vec4(vs_Col3), vec4(0.0, 0.0, -.995, 1.0));
  // vec3 p = vec3(vs_Pos.xy, 1.0);
  fs_Pos = T * vs_Pos; //vec2(T * p);
  fs_Col = vec3(0.0);
  gl_Position = u_ViewProj * T * vs_Pos;
}
