export default `
attribute vec2 aPos;
attribute vec2 aTexCoord;
varying   vec2 vTexCoord;
void main(void) {
	gl_Position = vec4(aPos, 0., 1.);
	vTexCoord = aTexCoord;
}
`;