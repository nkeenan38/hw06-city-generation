#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

const float MAX_DISTANCE = 50.0;
const int WATER_ITERATONS = 18;

// meterials
const int WATER = 0;
const int BUOY = 1;

// lighting
// const vec3 KEYLIGHT = vec3(-50.0, MAX_DISTANCE / 2.0, -50.0);
vec3 KEYLIGHT = normalize(vec3(-0.3,0.4,0.7));

const mat2 m2 = mat2( 0.80, -0.60, 0.60, 0.80 );

vec3 rotate(vec3 p, float x, float z)
{
  float cx = cos(x);
  float cz = cos(z);
  float sx = sin(x);
  float sz = sin(z);
  mat3 rotX = mat3(1.0, 0.0, 0.0,
           0.0, cx,  -sx,
           0.0, sx,  cx);
  mat3 rotZ = mat3(cz, -sz, 0.0,
           sz, cz, 0.0,
           0.0, 0.0, 1.0);
  mat3 t = rotX * rotZ;
  p = vec3(inverse(t) * p);
  return p;
}

vec3 translate(vec3 p, vec3 trans)
{
  mat4 t = mat4(vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(trans.x, trans.y, trans.z, 1.0));
  p = vec3(inverse(t) * vec4(p.x, p.y, p.z, 1.0));
  return p;
}

float opU(float a, float b)
{
  return min(a, b);
}

float opSmoothUnion( float d1, float d2, float k ) 
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); 
}

float random1(in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(311.7898,65.5333)))*
        65537.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a, b, c, d;

    // Four corners in 2D of a tile
    a = random1(i);
    b = random1(i + vec2(1.0, 0.0));
    c = random1(i + vec2(0.0, 1.0));
    d = random1(i + vec2(1.0, 1.0));
  

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm_9( in vec2 x )
{
    float f = 1.9;
    float s = 0.55;
    float a = 0.0;
    float b = 0.5;
    for( int i=0; i<9; i++ )
    {
        float n = noise(x);
        a += b*n;
        b *= s;
        x = f*m2*x;
    }
  return a;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdRoundedCylinder( vec3 p, float ra, float rb, float h )
{
    vec2 d = vec2( length(p.xz)-2.0*ra+rb, abs(p.y) - h );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float dot2( in vec3 v ) { return dot(v,v); }
float udQuad( vec3 p, vec3 a, vec3 b, vec3 c, vec3 d )
{
    vec3 ba = b - a; vec3 pa = p - a;
    vec3 cb = c - b; vec3 pb = p - b;
    vec3 dc = d - c; vec3 pc = p - c;
    vec3 ad = a - d; vec3 pd = p - d;
    vec3 nor = cross( ba, ad );

    return sqrt(
    (sign(dot(cross(ba,nor),pa)) +
     sign(dot(cross(cb,nor),pb)) +
     sign(dot(cross(dc,nor),pc)) +
     sign(dot(cross(ad,nor),pd))<3.0)
     ?
     min( min( min(
     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),
     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb) ),
     dot2(dc*clamp(dot(dc,pc)/dot2(dc),0.0,1.0)-pc) ),
     dot2(ad*clamp(dot(ad,pd)/dot2(ad),0.0,1.0)-pd) )
     :
     dot(nor,pa)*dot(nor,pa)/dot2(nor) );
}

vec3 opSymXZ(vec3 p)
{
    p.xz = abs(p.xz);
    return p;
}

bool intersects(vec3 p, vec3 dir, vec3 min, vec3 max)
{
  vec3 tmin, tmax;
    tmin.x = (min.x - p.x) / dir.x; 
    tmax.x = (max.x - p.x) / dir.x; 
 
    if (tmin.x > tmax.x)
    {
      float tmp = tmin.x;
      tmin.x = tmax.x;
      tmax.x = tmp;
    }
 
    tmin.y = (min.y - p.y) / dir.y; 
    tmax.y = (max.y - p.y) / dir.y; 
 
    if (tmin.y > tmax.y)
    {
      float tmp = tmin.y;
      tmin.y = tmax.y;
      tmax.y = tmp;
    }
 
    if ((tmin.x > tmax.y) || (tmin.y > tmax.x)) 
        return false; 
 
    if (tmin.y > tmin.x) 
        tmin.x = tmin.y; 
 
    if (tmax.y < tmax.x) 
        tmax.x = tmax.y; 
 
    tmin.z = (min.z - p.z) / dir.z; 
    tmax.z = (max.z - p.z) / dir.z; 
 
    if (tmin.z > tmax.z)
    {
      float tmp = tmin.z;
      tmin.z = tmax.z;
      tmax.z = tmp;
    }
 
    if ((tmin.x > tmax.z) || (tmin.z > tmax.x)) 
        return false; 
 
    if (tmin.z > tmin.x) 
        tmin.x = tmin.z; 
 
    if (tmax.z < tmax.x) 
        tmax.x = tmax.z; 
 
    return true; 
}

float oct(vec3 p){
    return fract(4768.1232345456 * sin((p.x+p.y*43.0+p.z*137.0)));
}

float noise3d(vec3 x){
    vec3 p = floor(x);
    vec3 fr = fract(x);
    vec3 LBZ = p + vec3(0.0, 0.0, 0.0);
    vec3 LTZ = p + vec3(0.0, 1.0, 0.0);
    vec3 RBZ = p + vec3(1.0, 0.0, 0.0);
    vec3 RTZ = p + vec3(1.0, 1.0, 0.0);

    vec3 LBF = p + vec3(0.0, 0.0, 1.0);
    vec3 LTF = p + vec3(0.0, 1.0, 1.0);
    vec3 RBF = p + vec3(1.0, 0.0, 1.0);
    vec3 RTF = p + vec3(1.0, 1.0, 1.0);

    float l0candidate1 = oct(LBZ);
    float l0candidate2 = oct(RBZ);
    float l0candidate3 = oct(LTZ);
    float l0candidate4 = oct(RTZ);

    float l0candidate5 = oct(LBF);
    float l0candidate6 = oct(RBF);
    float l0candidate7 = oct(LTF);
    float l0candidate8 = oct(RTF);

    float l1candidate1 = mix(l0candidate1, l0candidate2, fr[0]);
    float l1candidate2 = mix(l0candidate3, l0candidate4, fr[0]);
    float l1candidate3 = mix(l0candidate5, l0candidate6, fr[0]);
    float l1candidate4 = mix(l0candidate7, l0candidate8, fr[0]);


    float l2candidate1 = mix(l1candidate1, l1candidate2, fr[1]);
    float l2candidate2 = mix(l1candidate3, l1candidate4, fr[1]);


    float l3candidate1 = mix(l2candidate1, l2candidate2, fr[2]);

    return l3candidate1;
}


float supernoise3dX(vec3 p){

  float a =  noise3d(p);
  float b =  noise3d(p + 10.5);
  return (a * b);
}

// returns vec2 with wave height in X and its derivative in Y
vec2 wavedx(vec2 position, vec2 direction, float speed, float frequency, float timeshift) {
  direction = normalize(direction);
    float x = dot(direction, position) * frequency + timeshift * speed;
    float wave = exp(sin(x) - 1.0);
    float dx = wave * cos(x);
    return vec2(wave, -dx);
}

float supernoise3dX(vec3 p);

float getwaves(vec2 position, int iterations){
  float time = u_Time * 0.005;
    position *= 0.1;
  position += time;
  float iter = 0.0;
    float phase = 6.0;
    float speed = 2.0;
    float weight = 2.0;
    float w = 0.0;
    float ws = 0.0;
    vec2 p, res;
    for(int i=0;i<iterations;i++){
        p = vec2(sin(iter), cos(iter));
        res = wavedx(position, p, speed, phase, time);
        position += normalize(p) * res.y * weight * 0.048;
        w += res.x * weight;
        iter += 12.0;
        ws += weight;
        weight = mix(weight, 0.0, 0.2);
        phase *= 1.18;
        speed *= 1.07;
    }
    return 6.0 * (w / ws) * supernoise3dX(0.3 *vec3(position.x, position.y, 0.0) + time * 0.1);
}

bool intersectsWater(vec3 ro, vec3 rd)
{
  return true; // because so much of the scene is water, it actually runs faster without checking the bounding box
  vec3 min = vec3(-50.0, 0.0, -50.0);
  vec3 max = vec3(50.0, 1.0, 50.0);
  return intersects(ro, rd, min, max);
}

float sdWater( vec3 p)
{
  vec3 b = vec3(50.0, 0.001, 50.0);
  vec3 d = abs(p) - b;
  float water = length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0) - getwaves(p.xz, WATER_ITERATONS);
  return water;
}

bool intersectsBuoy(vec3 ro, vec3 rd)
{
  vec3 min = vec3(-1.4, 0.0, -1.4);
  vec3 max = vec3(1.4, 5.25, 1.4);
  return intersects(ro, rd, min, max); 
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float sdBuoy(vec3 p)
{
  vec3 center = vec3(0.0, 0.0, 0.0);
  float off = getwaves(center.xz, WATER_ITERATONS);

  vec2 fx1 = vec2(center.x - 0.65, getwaves(vec2(center.x - 0.65, center.z), WATER_ITERATONS));
  vec2 fx2 = vec2(center.x, off);
  vec2 fz1 = vec2(center.z - 0.65, getwaves(vec2(center.x, center.z - 0.65), WATER_ITERATONS));
  vec2 fz2 = vec2(center.z, off);

  float xAngle = atan(fx2.y - fx1.y, fx2.x - fx1.x) * 0.5;
  float zAngle = atan(fz2.y - fz1.y, fz2.x - fz1.x) * 0.5;

  

  p = translate(p, vec3(center.x, center.y + off, center.z));
  p = rotate(p, xAngle, zAngle);
  // base
  float base = sdRoundedCylinder(p, 0.65, 0.0, 0.5);
  base = min(base, sdRoundedCylinder(translate(p, vec3(0.0, 0.5, 0.0)), 0.2, 0.0, 0.2));
  vec3 dim = vec3(0.5, 0.0, 0.5);
  vec3 q = opSymXZ(translate(p, vec3(0.0, 0.5, 0.0)));
  float post = udQuad(q, dim, dim + vec3(-0.125, 0.0, 0.0), dim + vec3(-0.125, 3.0, 0.0), dim + vec3(0.0, 3.0, 0.0));
  post = min(post, udQuad(q, dim, dim + vec3(0.0, 0.0, -0.125), dim + vec3(0.0, 3.0, -0.125), dim + vec3(0.0, 3.0, 0.0)));
  post = min(post, sdRoundedCylinder(translate(p, vec3(0.0, 3.5, 0.0)), 0.37, 0.0, 0.01));
  post = min(post, udQuad(q, dim + vec3(0.0, 3.0, 0.0), dim + vec3(0.0, 1.5, 0.0), dim + vec3(-0.5, 1.5, - 0.5), dim + vec3(-0.5, 3.0, -0.5)));
  for (int i = 1; i < 4; i++)
  {
    float h = (3.0 / 4.0) * float(i);
    dim = vec3(dim.x, h, dim.z);
    post = min(post, udQuad(q, dim, dim + vec3(-0.5, 0.0, 0.0), dim + vec3(-0.5, 0.1, 0.0), dim + vec3(0.0, 0.1, 0.0)));
    post = min(post, udQuad(q, dim, dim + vec3(0.0, 0.0, -0.5), dim + vec3(0.0, 0.1, -0.5), dim + vec3(0.0, 0.1, 0.0)));
  }
  return min(base + 0.1*clamp(fbm_9(p.xz), 0.0, 1.0), post);
}

vec3 calcNormal(in vec3 p, int material)
{
    const vec3 eps = vec3(0.005,0.0,0.0);
    vec3 norm;
    float original;
    switch (material)
    {
      case WATER:
            original = sdWater(p);
            // use original point rather than subtracting from another
            // not as accurate, but saves computation time
            norm = normalize(vec3(
                    sdWater(p + eps.xyy) - original,
                    sdWater(p + eps.yxy) - original,
                    sdWater(p + eps.yyx) - original));
        // norm = normalize(vec3(
        //    sdWater(p + eps.xyy) - sdWater(p - eps.xyy),
        //    sdWater(p + eps.yxy) - sdWater(p - eps.yxy),
        //    sdWater(p + eps.yyx) - sdWater(p - eps.yyx)));
        break;
      case BUOY:
        norm = normalize(vec3(
          sdBuoy(p + eps.xyy) - sdBuoy(p - eps.xyy),
          sdBuoy(p + eps.yxy) - sdBuoy(p - eps.yxy),
          sdBuoy(p + eps.yyx) - sdBuoy(p - eps.yyx)));
        break;
    }
    return norm;
}

float softshadow(in vec3 ro, in vec3 rd, float mint, float k)
{
    float res = 1.0;
    float t = mint;
    for( int i=0; i<64; i++ )
    {
        float h = min(sdBuoy(ro + rd*t), sdWater(ro + rd*t));
    h = max( h, 0.0 );
        res = min( res, k*h/t );
        t += clamp( h, 0.001, 0.5 );
    if( res<0.001 ) break;
    }
    return clamp(res,0.0,1.0);
}

float ambientOcclusion(vec3 p)
{
  float sum = 0.0;
  float delta = 2.0;
  vec3 norm = vec3(1.0, 0.0, 0.0);//calcNormal(p, BUOY);
  float original = sdBuoy(p);
  for (int i = 1; i <= 5; i++)
  {
    float diff = abs(original - sdBuoy(p + norm*(delta/8.0)));
    sum += (1.0 / delta) * diff;
    delta *= 2.0;
  }
  return 1.0 - (1.0 * sum);
}

float rayMarchWater(vec3 eye, vec3 rayDirection, out int material)
{
  bool intWater = intersectsWater(eye, rayDirection);
  bool intBuoy = intersectsBuoy(eye, rayDirection);
  if (!intWater && !intBuoy) return MAX_DISTANCE;
  float depth = 0.001;
  const float EDGE_THRESHOLD = 0.015;
  int maxMarchingSteps = 200;
  float distance, lastDistance, water, buoy = MAX_DISTANCE;
  vec3 p;
  for (int i = 0; i < maxMarchingSteps; i++)
  {
    p = eye + depth * rayDirection;
    if (intWater) 
      water = sdWater(p);
    if (intBuoy) 
      buoy = sdBuoy(p);
    if (water < buoy)
    {
      distance = water;
      material = WATER;
    }
    else if (buoy < MAX_DISTANCE)
    {
      distance = buoy;
      material = BUOY;
    }
    if (distance < EDGE_THRESHOLD && distance > lastDistance + 0.00001)
    {
      // inside or on surface
      return depth;
    }
    if(distance < 0.001)
    {
      return depth;
    }
    depth += distance;
    lastDistance = distance;
    if (depth >= MAX_DISTANCE)
    {
      return MAX_DISTANCE;
    }
  }
  return MAX_DISTANCE;
}


vec3 renderSky( in vec3 ro, in vec3 rd )
{
    // background sky     
    vec3 col = 0.9*vec3(0.4,0.65,1.0) - rd.y*vec3(0.4,0.36,0.4);

    // clouds
    float t = (1000.0-ro.y)/(1.0 - rd.y);
    vec2 uv = (ro+t*rd).xz;
    float cl = fbm_9( uv*0.002 );
    float dl = smoothstep(-0.2,0.6,cl);
    col = mix( col, vec3(1.0), 0.4*dl );
    
  // sun glare    
    float sun = clamp( dot(KEYLIGHT,rd), 0.0, 1.0 );
    col += 0.6*vec3(1.0,0.6,0.3)*pow( sun, 32.0 );
    
  return col;
}


void main() {
  float len = distance(u_Ref, u_Eye);
  vec3 forward = normalize(u_Ref - u_Eye);
  vec3 right = cross(forward, u_Up);
  float aspectRatio = u_Dimensions.x / u_Dimensions.y;
  vec3 V = u_Up * len * tan(radians(30.0));
  vec3 H = right * len * tan(radians(30.0));
  vec3 p = u_Ref + fs_Pos.x * H + fs_Pos.y * V;
  vec3 dir = normalize(p - u_Eye);
  out_Col = vec4(renderSky(u_Eye, dir), 1.0);
}


