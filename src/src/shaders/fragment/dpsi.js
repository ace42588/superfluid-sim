export default `
precision highp float;
precision highp sampler2D;
uniform sampler2D s_psi;
uniform sampler2D s_k;
uniform int kstep;
uniform int addPot;
uniform int addTrap;
uniform float addPot_x;
uniform float addPot_y;
uniform float addPot_r;
uniform int addSlits;
uniform float addSlits_w;
uniform float addSlits_s;
uniform float dx2;
uniform float dt;
uniform float gamma;
uniform float ang_mom;
varying vec2 vTexCoord;
const float d = 1./256.;
const int maxObj = 255;
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
void main(void) {
	vec2 eye = vec2(0., 1.);
	// Unpack
	vec2 psi = unpackCmpx(texture2D(s_psi, vTexCoord));
	vec2 psi_pdy = unpackCmpx(texture2D(s_psi, vec2(vTexCoord.x, vTexCoord.y + d)));
	vec2 psi_mdy = unpackCmpx(texture2D(s_psi, vec2(vTexCoord.x, vTexCoord.y - d)));
	vec2 psi_pdx = unpackCmpx(texture2D(s_psi, vec2(vTexCoord.x + d, vTexCoord.y)));
	vec2 psi_mdx = unpackCmpx(texture2D(s_psi, vec2(vTexCoord.x - d, vTexCoord.y)));

	// RK4 step
	if (kstep > 1){
		vec2 k = unpackCmpx(texture2D(s_k, vTexCoord));
		vec2 k_pdy = unpackCmpx(texture2D(s_k, vec2(vTexCoord.x, vTexCoord.y + d)));
		vec2 k_mdy = unpackCmpx(texture2D(s_k, vec2(vTexCoord.x, vTexCoord.y - d)));
		vec2 k_pdx = unpackCmpx(texture2D(s_k, vec2(vTexCoord.x + d, vTexCoord.y)));
		vec2 k_mdx = unpackCmpx(texture2D(s_k, vec2(vTexCoord.x - d, vTexCoord.y)));
		if (kstep == 4){
			psi += k;
			psi_pdy += k_pdy;
			psi_mdy += k_mdy;
			psi_pdx += k_pdx;
			psi_mdx += k_mdx;
		} else {
			psi += 0.5*k;
			psi_pdy += 0.5*k_pdy;
			psi_mdy += 0.5*k_mdy;
			psi_pdx += 0.5*k_pdx;
			psi_mdx += 0.5*k_mdx;
		}
	}

	// Finite difference GPE
	vec2 dpsi_H = -0.5*(psi_pdy + psi_mdy + psi_pdx + psi_mdx - 4.*psi)/dx2  + (psi.x*psi.x + psi.y*psi.y)*psi - psi;

	// Potential obstacle
	if(addPot > 0){
		dpsi_H += 5.*exp(-64.*64.*(vTexCoord.x-addPot_x)*(vTexCoord.x-addPot_x)/addPot_r 
					- 64.*64.*(vTexCoord.y-addPot_y)*(vTexCoord.y-addPot_y)/addPot_r)*psi;
	}
	
	// Double Slit
	if(addSlits > 0){
		// left and right barriers
		int steps = 50/int(addPot_r);
		for(int i=0;i<maxObj;i++){
			if(i>steps){break;}
			float offset = (float(i)*addPot_r)/100.;
			if(addSlits_s<offset && offset<addSlits_w+addSlits_s){continue;}
			dpsi_H += 2.*exp(-64.*64.*(vTexCoord.x-0.5-offset)*(vTexCoord.x-0.5-offset)/addPot_r 
						- 64.*64.*(vTexCoord.y-0.5)*(vTexCoord.y-0.5)/addPot_r)*psi;
			dpsi_H += 2.*exp(-64.*64.*(vTexCoord.x-0.5+offset)*(vTexCoord.x-0.5+offset)/addPot_r 
						- 64.*64.*(vTexCoord.y-0.5)*(vTexCoord.y-0.5)/addPot_r)*psi;
		}
	}

	// Trap
	if(addTrap > 0){
		dpsi_H += 10.*((1.01*vTexCoord.x-0.5)*(1.01*vTexCoord.x-0.5) + (vTexCoord.y-0.5)*(vTexCoord.y-0.5))*psi;
	}

	// Rotating frame
	if(ang_mom > 0.001){
		dpsi_H += cmpxmul(-eye,(ang_mom-5.)*((vTexCoord.y-0.5)*(psi_pdx - psi_mdx) - (vTexCoord.x-0.5)*(psi_pdy-psi_mdy)))/sqrt(dx2);
	}

	// Dissipation
	vec2 dpsi;
	dpsi = cmpxmul(dpsi_H,-gamma-eye)*dt;        
	gl_FragColor = packCmpx(dpsi);
}
`;