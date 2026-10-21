// Planetas en 3D con PixiJS (WebGL): cada planeta es un cuadrado con un shader que calcula, píxel a píxel,
// dónde cae en una esfera y lee el mapa real de su superficie. Así giran sobre su eje, ruedan al moverse,
// tienen luz, atmósfera y (Saturno y Urano) anillos 3D con la sombra del planeta.
// Uso: await Sphere.load(); const m = Sphere.mesh(i); m.update({ spin, roll, pitch, time }); container.addChild(m)
(function () {
  const VERT = `
in vec2 aPosition;
out vec2 vPos;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vPos = aPosition;
}`;
  const FRAG = `
precision highp float;
in vec2 vPos;
uniform sampler2D uTex;
uniform sampler2D uClouds;
uniform sampler2D uRing;
uniform vec4 uP;     // spin, giro en el plano (inclinación + rodar), pitch (vista desde arriba), tipo (0 roca, 1 Tierra, 2 gas, 3 Sol)
uniform vec4 uAtmo;  // color de la atmósfera, intensidad
uniform vec4 uRingP; // radio interior, radio exterior, opacidad, tinte gris (0..1)
uniform vec4 uMisc;  // tamaño en píxeles del radio, alfa, tiempo, luz (0 = plano, 1 = sombreado completo)
const float PI = 3.14159265;
vec3 rotZ(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z); }
vec3 rotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 toPlanet(vec3 v) { return rotX(rotZ(v, -uP.y), -uP.z); }
void main() {
  vec2 p = vPos;
  float r = length(p);
  vec3 L = normalize(vec3(-0.55, 0.6, 0.8));
  float kind = uP.w;
  float px = max(uMisc.x, 1.0);
  vec4 col = vec4(0.0);

  // Brillo exterior (corona del Sol o atmósfera), detrás de todo
  if (r > 1.0) {
    float g = kind > 2.5 ? exp(-(r - 1.0) * 5.0) * 0.9 : exp(-(r - 1.0) * 14.0) * uAtmo.a * 0.8;
    vec3 gc = kind > 2.5 ? vec3(1.0, 0.62, 0.18) : uAtmo.rgb;
    col = vec4(gc * g, g);
  }

  // Esfera
  float zs = -10.0;
  if (r < 1.0 + 1.5 / px) {
    float rr = min(r, 0.99999);
    float z = sqrt(1.0 - rr * rr);
    zs = z;
    vec3 n = vec3(p.x, -p.y, z);
    vec3 q = toPlanet(n);
    float lon = atan(q.x, q.z) + uP.x;
    float lat = asin(clamp(q.y, -1.0, 1.0));
    vec2 uv = vec2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI);
    vec3 c = texture2D(uTex, uv).rgb;
    if (kind > 0.5 && kind < 1.5) {
      float cl = texture2D(uClouds, vec2(fract((lon + uMisc.z * 0.02) / (2.0 * PI) + 0.5), uv.y)).r;
      c = mix(c, vec3(1.0), cl * 0.75);
    }
    float diff = max(dot(n, L), 0.0);
    vec3 shaded;
    if (kind > 2.5) {
      float limb = 0.55 + 0.45 * pow(z, 0.6);
      float flick = 0.94 + 0.06 * sin(uMisc.z * 2.0 + uv.x * 40.0 + uv.y * 30.0);
      shaded = c * 1.35 * limb * flick + vec3(0.25, 0.1, 0.0) * (1.0 - z);
    } else {
      float lit = mix(1.0, 0.18 + 0.95 * diff, uMisc.w);
      shaded = c * lit;
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      shaded += vec3(1.0) * pow(max(dot(n, H), 0.0), 40.0) * (kind > 0.5 && kind < 1.5 ? 0.35 : 0.08) * uMisc.w;
      float rim = pow(1.0 - z, 2.2) * uAtmo.a;
      shaded += uAtmo.rgb * rim * (0.35 + 0.65 * max(dot(n, L) + 0.4, 0.0));
    }
    float edge = clamp((1.0 - r) * px + 0.5, 0.0, 1.0);
    col = mix(col, vec4(shaded, 1.0), edge);
  }

  // Anillos: plano del ecuador del planeta, en 3D
  if (uRingP.z > 0.0) {
    vec3 a = rotZ(vec3(p.x, -p.y, 0.0), -uP.y);
    float sp = sin(uP.z), cp = cos(uP.z);
    if (abs(sp) > 0.01) {
      float zr = -a.y * cp / sp;
      vec3 pv = vec3(p.x, -p.y, zr);
      vec3 pp = toPlanet(pv);
      float d = length(pp);
      if (d > uRingP.x && d < uRingP.y && (zs < -5.0 || zr > zs)) {
        float u = (d - uRingP.x) / (uRingP.y - uRingP.x);
        vec4 rc = texture2D(uRing, vec2(clamp(u, 0.01, 0.99), 0.5));
        rc.a *= smoothstep(0.0, 0.03, u) * smoothstep(1.0, 0.97, u);
        rc.rgb = mix(rc.rgb * vec3(1.3, 1.15, 0.95), vec3(dot(rc.rgb, vec3(0.33))) * vec3(0.8, 0.9, 1.0), uRingP.w);
        float b = dot(pv, L), cc = dot(pv, pv) - 1.0, disc = b * b - cc;
        float shadow = (disc > 0.0 && -b + sqrt(disc) > 0.0) ? 0.25 : 1.0;
        float lightK = mix(1.0, 0.55 + 0.45 * abs(dot(normalize(rotZ(rotX(vec3(0.0, 1.0, 0.0), uP.z), uP.y)), L)), uMisc.w);
        float al = rc.a * uRingP.z;
        col = mix(col, vec4(rc.rgb * shadow * lightK * 1.1, 1.0), al);
      }
    }
  }
  gl_FragColor = vec4(col.rgb * col.a, col.a) * uMisc.y;
}`;

  // Datos visuales de cada cuerpo, en el orden del juego
  const LOOK = [
    { tex: 'moon', kind: 0, tilt: 6.7, spin: .25, atmo: [.8, .8, .9, .12] },
    { tex: 'mercury', kind: 0, tilt: .03, spin: .18, atmo: [.8, .75, .7, .12] },
    { tex: 'mars', kind: 0, tilt: 25.2, spin: .5, atmo: [1, .55, .35, .35] },
    { tex: 'venus', kind: 2, tilt: 177.4, spin: -.12, atmo: [1, .85, .5, .55] },
    { tex: 'earth', kind: 1, tilt: 23.4, spin: .5, atmo: [.35, .65, 1, .85] },
    { tex: 'neptune', kind: 2, tilt: 28.3, spin: .7, atmo: [.35, .5, 1, .7] },
    { tex: 'uranus', kind: 2, tilt: 97.8, spin: -.6, atmo: [.55, .9, 1, .6], ring: [1.6, 2.05, .35, .8] },
    { tex: 'saturn', kind: 2, tilt: 26.7, spin: .8, atmo: [1, .9, .6, .4], ring: [1.24, 2.33, 1, 0] },
    { tex: 'jupiter', kind: 2, tilt: 3.1, spin: .9, atmo: [1, .85, .7, .4] },
    { tex: 'sun', kind: 3, tilt: 7.25, spin: .15, atmo: [1, .7, .2, 1] }
  ];
  const EXTENT = LOOK.map(l => l.ring ? l.ring[1] + .05 : l.kind === 3 ? 1.6 : 1.25);

  let program = null, tex = {}, geos = {};
  async function load(base) {
    base = base || 'tex/';
    const names = [...new Set(LOOK.map(l => l.tex)), 'clouds'];
    const list = await Promise.all(names.map(n => PIXI.Assets.load({ src: base + n + '.jpg', alias: 'tex_' + n })));
    names.forEach((n, i) => { tex[n] = list[i]; });
    tex.ring = await PIXI.Assets.load({ src: base + 'ring.png', alias: 'tex_ring' });
    for (const k in tex) { const s = tex[k].source; s.style.addressModeU = 'repeat'; s.style.addressModeV = 'clamp-to-edge'; s.style.update && s.style.update(); }
    program = PIXI.GlProgram.from({ vertex: VERT, fragment: FRAG, name: 'planet-sphere' });
  }
  function geometry(e) {
    if (geos[e]) return geos[e];
    return (geos[e] = new PIXI.Geometry({ attributes: { aPosition: [-e, -e, e, -e, e, e, -e, e] }, indexBuffer: [0, 1, 2, 0, 2, 3] }));
  }
  const DEG = Math.PI / 180;
  function mesh(i) {
    const l = LOOK[i];
    const u = new PIXI.UniformGroup({
      uP: { value: new Float32Array([Math.random() * 6.28, l.tilt * DEG, .32, l.kind]), type: 'vec4<f32>' },
      uAtmo: { value: new Float32Array(l.atmo), type: 'vec4<f32>' },
      uRingP: { value: new Float32Array(l.ring || [0, 0, 0, 0]), type: 'vec4<f32>' },
      uMisc: { value: new Float32Array([40, 1, 0, 1]), type: 'vec4<f32>' }
    });
    const shader = new PIXI.Shader({ glProgram: program, resources: { uTex: tex[l.tex].source, uClouds: tex.clouds.source, uRing: tex.ring.source, pu: u } });
    const m = new PIXI.Mesh({ geometry: geometry(EXTENT[i]), shader });
    m.level = i; m.u = u.uniforms; m.spinRate = l.spin; m.tilt = l.tilt * DEG; m.extent = EXTENT[i];
    // radius: radio en píxeles; roll: giro en el plano por rodar; spin: giro sobre su eje; pitch: cuánto vemos el polo
    m.update = function (o) {
      const P = this.u.uP, M = this.u.uMisc;
      if (o.radius != null) { this.scale.set(o.radius); M[0] = o.radius * (o.res || 1); }
      if (o.spin != null) P[0] = o.spin;
      if (o.roll != null) P[1] = this.tilt + o.roll;
      if (o.pitch != null) P[2] = o.pitch;
      if (o.alpha != null) M[1] = o.alpha;
      if (o.time != null) M[2] = o.time;
      if (o.light != null) M[3] = o.light;
    };
    return m;
  }
  window.Sphere = { load, mesh, LOOK, EXTENT };
})();
