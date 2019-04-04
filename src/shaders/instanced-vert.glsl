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
out vec4 fs_Nor;
out vec3 scale;

void main() {
	mat4 T = mat4(vs_Col1, vs_Col2, vs_Col3, vs_Col4);
	fs_Pos = vs_Pos; 
	fs_Nor = vs_Nor;
	fs_Col = vec3(0.0);
	scale = vec3(vs_Col1[1], vs_Col2[2], vs_Col3[3]);
	gl_Position = u_ViewProj * T * vs_Pos;
}
