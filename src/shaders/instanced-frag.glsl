#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec4 fs_Pos;
in vec3 fs_Col;

out vec4 out_Col;

void main() {
	out_Col = vec4(fs_Col, 1.0);
	return;
  if (fs_Pos.x <= 0.0 && fs_Pos.z <= 0.0)
  {
  	out_Col = vec4(1.0, 0.0, 0.0, 1.0);
  }
  else if (fs_Pos.x <= 0.0 && fs_Pos.z > 0.0)
  {
	out_Col = vec4(0.0, 1.0, 0.0, 1.0);
  }
  else if (fs_Pos.x > 0.0 && fs_Pos.z <= 0.0)
  {
  	out_Col = vec4(0.0, 0.0, 1.0, 1.0);
  }
  else
  {
  	out_Col = vec4(1.0, 0.0, 1.0, 1.0);
  }
}
