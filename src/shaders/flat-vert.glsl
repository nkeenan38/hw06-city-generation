#version 300 es
precision highp float;
uniform mat4 u_ViewProj;


// The vertex shader used to render the background of the scene

in vec4 vs_Pos;

out vec4 fs_Pos;

void main() {
  fs_Pos = vs_Pos;
  gl_Position = u_ViewProj * vs_Pos;
}
