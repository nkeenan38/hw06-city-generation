#version 300 es
precision highp float;

// uniform vec3 u_Eye, u_Ref, u_Up;
// uniform vec2 u_Dimensions;
// uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

// vec3 KEYLIGHT = normalize(vec3(-0.3,0.4,0.7));

// const mat2 m2 = mat2( 0.80, -0.60, 0.60, 0.80 );

// float random1(in vec2 st) {
//     return fract(sin(dot(st.xy,
//                          vec2(311.7898,65.5333)))*
//         65537.5453123);
// }

// // Based on Morgan McGuire @morgan3d
// // https://www.shadertoy.com/view/4dS3Wd
// float noise (in vec2 st) {
//     vec2 i = floor(st);
//     vec2 f = fract(st);
//     float a, b, c, d;

//     // Four corners in 2D of a tile
//     a = random1(i);
//     b = random1(i + vec2(1.0, 0.0));
//     c = random1(i + vec2(0.0, 1.0));
//     d = random1(i + vec2(1.0, 1.0));
  

//     vec2 u = f * f * (3.0 - 2.0 * f);

//     return mix(a, b, u.x) +
//             (c - a)* u.y * (1.0 - u.x) +
//             (d - b) * u.x * u.y;
// }

// float fbm_9( in vec2 x )
// {
//     float f = 1.9;
//     float s = 0.55;
//     float a = 0.0;
//     float b = 0.5;
//     for( int i=0; i<9; i++ )
//     {
//         float n = noise(x);
//         a += b*n;
//         b *= s;
//         x = f*m2*x;
//     }
//   return a;
// }

// vec3 renderSky( in vec3 ro, in vec3 rd )
// {
//     // background sky     
//     vec3 col = 0.9*vec3(0.4,0.65,1.0) - rd.y*vec3(0.4,0.36,0.4);

//     // clouds
//     float t = (1000.0-ro.y)/(1.0 - rd.y);
//     vec2 uv = (ro+t*rd).xz;
//     float cl = fbm_9( uv*0.002 );
//     float dl = smoothstep(-0.2,0.6,cl);
//     col = mix( col, vec3(1.0), 0.4*dl );
    
// 	// sun glare    
//     float sun = clamp( dot(KEYLIGHT,rd), 0.0, 1.0 );
//     col += 0.6*vec3(1.0,0.6,0.3)*pow( sun, 32.0 );
    
// 	return col;
// }


void main() {
  out_Col = vec4(1.0, 0.0, 0.0, 1.0);
  return;
  // float len = distance(u_Ref, u_Eye);
  // vec3 forward = normalize(u_Ref - u_Eye);
  // vec3 right = cross(forward, u_Up);
  // float aspectRatio = u_Dimensions.x / u_Dimensions.y;
  // vec3 V = u_Up * len * tan(radians(30.0));
  // vec3 H = right * len * aspectRatio * tan(radians(30.0));
  // vec3 p = u_Ref + fs_Pos.x * H + fs_Pos.y * V;
  // vec3 dir = normalize(p - u_Eye);

  // out_Col = vec4(renderSky(u_Eye, dir), 1.0);
}