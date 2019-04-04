#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_BuildingType;


in vec4 fs_Pos;
in vec3 fs_Col;
in vec4 fs_Nor;
in vec3 scale;

out vec4 out_Col;

void main() {
	vec4 buildingColor = (u_BuildingType == 0) ? vec4(0.5, 0.5, 0.5, 1.0) : (u_BuildingType == 1) ? vec4(0.65, 0.5, 0.5, 1.0) : vec4(0.7, 0.7, 0.5, 1.0);
	// max Z is 2
	vec4 diffuseColor = buildingColor;
	if (int(abs(fs_Pos.x + fs_Pos.y) * 1000.0) % 4 >= 1 && fs_Nor.z != 1.0)
	{
		diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
	}
	if (u_BuildingType == 0 && fs_Nor.z != 1.0)
	{
		diffuseColor = vec4(0.0, 0.0, 0.075, 1.0);
	}
	if (int(abs(fs_Pos.z) * 1000.0) % 5 == 0 && fs_Nor.z != 1.0)
	{
		diffuseColor = buildingColor;
	}
	if (fs_Pos.z < 0.005) 
	{
		diffuseColor = buildingColor;
		if (abs(fs_Pos.x) < 0.001) diffuseColor = vec4(0.4, 0.0, 0.0, 1.0);
	}
  	vec3 norm = fs_Nor.xyz;

  	vec3 lightDir = normalize(vec3(0.0, 0.5, 0.5));
	// Calculate the diffuse term for Lambert shading
	float diffuseTerm = dot(norm, lightDir);
	// if (dot(norm, -dir) <= 0.2) diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
	// Avoid negative lighting values
	diffuseTerm = clamp(diffuseTerm, 0.0f, 1.0f);

	float ambientTerm = 0.3;

	float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
	                                                    //to simulate ambient lighting. This ensures that faces that are not
	                                                    //lit by our point light are not completely black.

	// Compute final shaded color
	out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
