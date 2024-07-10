export default `
precision highp float;
precision highp sampler2D;
uniform sampler2D s_psi;
uniform sampler2D s_k1;
uniform sampler2D s_k2;
uniform sampler2D s_k3;
uniform sampler2D s_k4;
uniform int addVortex;
uniform int reset;
uniform int quench;
uniform int randVort;
uniform float addVortex_x;
uniform float addVortex_y;
uniform float addVortex_ang_mom;
uniform vec2 addVortex_init_velocity;
varying vec2 vTexCoord;
const float d = 1./256.;
vec4 packCmpx( in vec2 value ) {
	const vec2 bit_mask = vec2( 0.0, 0.00390625 );
	const vec2 mult_vec = vec2( 65280.0, 255.0 );
	value = (value + 2.5)/5.;
	vec2 res1 = mod( value.x * mult_vec, vec2( 256 ) ) / vec2( 255 );
	vec2 res2 = mod( value.y * mult_vec, vec2( 256 ) ) / vec2( 255 );
	res1 -= res1.xx * bit_mask;
	res2 -= res2.xx * bit_mask;
	return vec4(res1,res2);
}
vec2 unpackCmpx( in vec4 rgba ) {
	vec2 bitSh = vec2( 0.00390625, 1.0 );
	return vec2(dot(rgba.xy,bitSh),dot(rgba.zw, bitSh))*5. - 2.5;
}
vec2 cmpxmul(in vec2 a, in vec2 b) {
	return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}
int mod(int x, int y){
	return x-y*(x/y);
}
void main(void) {
	// Unpack
	vec2 psi = unpackCmpx(texture2D(s_psi, vTexCoord));
	vec2 k1 = unpackCmpx(texture2D(s_k1, vTexCoord));
	vec2 k2 = unpackCmpx(texture2D(s_k2, vTexCoord));
	vec2 k3 = unpackCmpx(texture2D(s_k3, vTexCoord));
	vec2 k4 = unpackCmpx(texture2D(s_k4, vTexCoord));

	// Final RK4 step
	vec2 psi_new = psi + k1/6. + k2/3. + k3/3. + k4/6.;

	// Add vortices
	if (addVortex != 0){
		vec2 relPos = vec2(vTexCoord.y-addVortex_y,vTexCoord.x-addVortex_x);
		//float angle = atan(relPos.y, relPos.x);
		float angle = atan(relPos.y, relPos.x);
		float phase;
		if (addVortex_ang_mom != 0.){
			phase = angle * addVortex_ang_mom;
		} else {
			phase = angle;
		}
		
		if (addVortex==1){
			psi_new = cmpxmul(psi_new,vec2(cos(phase), -sin(phase)));

		} else if (addVortex==-1){
			psi_new = cmpxmul(psi_new,vec2(cos(-phase), -sin(-phase)));
		}
	}

	// Reset system to unit wavefunction
	if (reset==1){
		psi_new = vec2(1.0,0.0);
	}

	// Quench the phase
	if (quench==1){
		float phase = fract(sin(dot(vTexCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
		psi_new = 2.*vec2(cos(2.*phase),sin(2.*phase));
	}

	// Insert vortices randomly
	if (randVort > 0){
		psi_new = vec2(1.0,0.0);
		float rx;
		float ry;
		float rp;
		int acc = randVort;
		for(int i=0;i<30;i++){
			acc = 75*acc + 74;
			rx = float(mod(acc, 67))/67.;
			ry = float(mod(acc/67, 67))/67.;
			rp = float(2*mod(randVort+i,2) - 1);
			psi_new = cmpxmul(psi_new,vec2(cos(rp*atan(vTexCoord.y-ry,vTexCoord.x-rx)),
						-sin(rp*atan(vTexCoord.y-ry,vTexCoord.x-rx))));
		}
	}
	gl_FragColor = packCmpx(psi_new);
}
`;