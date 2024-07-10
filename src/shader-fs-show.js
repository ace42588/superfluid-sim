export default `
precision highp float;
precision highp sampler2D;
uniform sampler2D s_psi;
uniform int showPhase;
varying vec2 vTexCoord;
float cmpxmag(in vec2 c) {
	return sqrt(c.x * c.x + c.y * c.y);
}
vec2 unpackCmpx( in vec4 rgba ) {
	vec2 bitSh = vec2( 0.00390625, 1.0 );
	return vec2(dot(rgba.xy,bitSh),dot(rgba.zw, bitSh))*5. - 2.5;
}
void main(void) {
	vec2 psi = unpackCmpx(texture2D(s_psi, vTexCoord));
	float i = cmpxmag(psi);
	float a = atan(psi.y, psi.x)*.955 + 3.;
	if (showPhase == 1){
		gl_FragColor = vec4(pow(i,2.)*clamp(abs(a - 3.) - 1., 0., 1.),pow(i,2.)*clamp(2. - abs(a - 2.), 0., 1.),pow(i,2.)*clamp(2. - abs(a - 4.), 0., 1.), 1.);
	} else {
		gl_FragColor = vec4(pow(i,2.), pow(i,2.), pow(i,2.), 1.);
	}
}
`;