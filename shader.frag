#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float r = 0.5 + 0.5 * sin(time + uv.x * 10.0);
  float g = 0.5 + 0.5 * cos(time + uv.y * 10.0);
  float b = 0.5 + 0.5 * sin(time);
  O = vec4(r, g, b, 1.0);
}
