import VertShader from "./shaders/vertex/vs.js";
import ShowFrag from "./shaders/fragment/show.js";
import DpsiFrag from "./shaders/fragment/dpsi.js";
import StepFrag from "./shaders/fragment/step.js";

import UI from "./ui.js";

export default class GPE {
  static getShader(gl, str, type) {
    let shader = gl.createShader(gl[type]);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
      console.log(gl.getShaderInfoLog(shader));
    return shader;
  }

  static makeTexture(gl, gl_tex, width, height, pix) {
    const t = gl.createTexture();
    gl.activeTexture(gl_tex);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pix
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    GPE.setBoundaryType({ gl, textures: [gl_tex], type: "MIRRORED_REPEAT" });
    return t;
  }

  static makeFBO(gl, gl_tex, width, height, pix) {
    const fbo = gl.createFramebuffer();
    const texture = this.makeTexture(gl, gl_tex, width, height, pix);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    return fbo;
  }

  static setBoundaryType({ gl, textures, type }) {
    //setReflective: gl.MIRRORED_REPEAT, setPeriodic: gl.REPEAT
    if (type !== "MIRRORED_REPEAT" && type !== "REPEAT") {
      console.error("setBoundaryType", "Invalid boundary type:", type);
      return;
    }
    if (!Array.isArray(textures)) textures = [textures];
    textures.forEach((gl_tex) => {
      console.debug("setBoundaryType", { gl_tex });
      gl.activeTexture(gl_tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[type]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[type]);
    });
  }

  initShaders() {
    const gl = this.gl;
    var prog_rk4 = (this.prog_rk4 = gl.createProgram());
    var prog_step = (this.prog_step = gl.createProgram());
    var prog_show = (this.prog_show = gl.createProgram());

    // Compile, attach and link shaders
    gl.attachShader(prog_rk4, GPE.getShader(gl, VertShader, "VERTEX_SHADER"));
    gl.attachShader(prog_rk4, GPE.getShader(gl, DpsiFrag, "FRAGMENT_SHADER"));
    gl.linkProgram(prog_rk4);

    gl.attachShader(prog_step, GPE.getShader(gl, VertShader, "VERTEX_SHADER"));
    gl.attachShader(prog_step, GPE.getShader(gl, StepFrag, "FRAGMENT_SHADER"));
    gl.linkProgram(prog_step);

    gl.attachShader(prog_show, GPE.getShader(gl, VertShader, "VERTEX_SHADER"));
    gl.attachShader(prog_show, GPE.getShader(gl, ShowFrag, "FRAGMENT_SHADER"));
    gl.linkProgram(prog_show);

    // Initialise the RK4 substep shader parameters
    gl.useProgram(prog_rk4);
    var aPosLoc = gl.getAttribLocation(prog_rk4, "aPos");
    var aTexLoc = gl.getAttribLocation(prog_rk4, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, gl.FALSE, 16, 8);
    gl.enableVertexAttribArray(aPosLoc);
    gl.enableVertexAttribArray(aTexLoc);

    // Store some uniform locations for use in the draw loop later
    this.prog_rk4_psi = gl.getUniformLocation(prog_rk4, "s_psi");
    this.prog_rk4_k = gl.getUniformLocation(prog_rk4, "s_k");
    this.prog_rk4_kstep = gl.getUniformLocation(prog_rk4, "kstep");

    gl.uniform1f(gl.getUniformLocation(prog_rk4, "dt"), this.opts["dt"]);
    gl.uniform1f(gl.getUniformLocation(prog_rk4, "dx2"), this.opts["dx2"]);
    gl.uniform1f(gl.getUniformLocation(prog_rk4, "gamma"), this.opts["gamma"]);
    gl.uniform1i(gl.getUniformLocation(prog_rk4, "addTrap"), false);
    gl.uniform1i(
      gl.getUniformLocation(prog_rk4, "addPot"),
      this.opts["addPot"]["active"]
    );
    gl.uniform1f(
      gl.getUniformLocation(prog_rk4, "addPot_x"),
      this.opts["addPot"]["x"]
    );
    gl.uniform1f(
      gl.getUniformLocation(prog_rk4, "addPot_y"),
      this.opts["addPot"]["y"]
    );
    gl.uniform1f(
      gl.getUniformLocation(prog_rk4, "addPot_r"),
      this.opts["addPot"]["r"]
    );
    gl.uniform1f(gl.getUniformLocation(prog_rk4, "ang_mom"), 5);

    // Initialise the RK4 overall time stepp shader parameters
    gl.useProgram(prog_step);
    var aPosLoc_step = gl.getAttribLocation(prog_step, "aPos");
    var aTexLoc_step = gl.getAttribLocation(prog_step, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(aPosLoc_step, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(aTexLoc_step, 2, gl.FLOAT, gl.FALSE, 16, 8);
    gl.enableVertexAttribArray(aPosLoc_step);
    gl.enableVertexAttribArray(aTexLoc_step);

    // Store some uniform locations for use in the draw loop later
    this.prog_step_psi = gl.getUniformLocation(prog_step, "s_psi");
    this.prog_step_addVortex = gl.getUniformLocation(prog_step, "addVortex");
    this.prog_step_reset = gl.getUniformLocation(prog_step, "reset");
    this.prog_step_quench = gl.getUniformLocation(prog_step, "quench");
    this.prog_step_randVort = gl.getUniformLocation(prog_step, "randVort");
    gl.uniform1i(gl.getUniformLocation(prog_step, "s_k1"), 2);
    gl.uniform1i(gl.getUniformLocation(prog_step, "s_k2"), 3);
    gl.uniform1i(gl.getUniformLocation(prog_step, "s_k3"), 4);
    gl.uniform1i(gl.getUniformLocation(prog_step, "s_k4"), 5);
    gl.uniform1f(
      gl.getUniformLocation(prog_step, "addVortex"),
      this.opts["addVortex"]["active"]
    );
    gl.uniform1f(
      gl.getUniformLocation(prog_step, "addVortex_x"),
      this.opts["addVortex"]["x"]
    );
    gl.uniform1f(
      gl.getUniformLocation(prog_step, "addVortex_y"),
      this.opts["addVortex"]["y"]
    );

    // Set some initial values
    gl.uniform1i(this.prog_step_addVortex, 0);
    gl.uniform1i(this.prog_step_reset, 1);
    gl.uniform1i(this.prog_step_quench, 0);
    gl.uniform1i(this.prog_step_randVort, Math.floor(Math.random() * 256));

    // Initialise the display output shader parameters
    gl.useProgram(prog_show);
    gl.uniform1i(gl.getUniformLocation(prog_show, "psi"), 1);
    gl.uniform1i(
      gl.getUniformLocation(prog_show, "showPhase"),
      this.opts["showPhase"]
    );
  }

  stepAndDraw() {
    const gl = this.gl;
    // Take multiple small timesteps per draw as a balance between simulation speed and numerical stability
    for (let i = 0; i < 10; i++) {
      // First RK4 pass
      gl.useProgram(this.prog_rk4);
      gl.uniform1i(this.prog_rk4_psi, 1);
      gl.uniform1i(this.prog_rk4_kstep, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 2);
      gl.uniform1i(this.prog_rk4_kstep, 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 3);
      gl.uniform1i(this.prog_rk4_kstep, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 4);
      gl.uniform1i(this.prog_rk4_kstep, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.useProgram(this.prog_step);
      gl.uniform1i(this.prog_step_psi, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_PSI1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.uniform1i(this.prog_step_addVortex, 0);
      gl.uniform1i(this.prog_step_reset, 0);
      gl.uniform1i(this.prog_step_quench, 0);
      gl.uniform1i(this.prog_step_randVort, 0);

      // Second RK4 pass
      gl.useProgram(this.prog_rk4);
      gl.uniform1i(this.prog_rk4_psi, 0);
      gl.uniform1i(this.prog_rk4_kstep, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 2);
      gl.uniform1i(this.prog_rk4_kstep, 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 3);
      gl.uniform1i(this.prog_rk4_kstep, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.uniform1i(this.prog_rk4_k, 4);
      gl.uniform1i(this.prog_rk4_kstep, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_K4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.useProgram(this.prog_step);
      gl.uniform1i(this.prog_step_psi, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO_PSI2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Draw the wavefunction...
    gl.useProgram(this.prog_show);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ...and loop
    requestAnimationFrame(this.stepAndDraw.bind(this));
  }

  changeBoundary(value) {
    GPE.setBoundaryType({
      gl: this.gl,
      textures: this.textures,
      type: value == "Periodic" ? "REPEAT" : "MIRRORED_REPEAT",
    });
  }

  spawnVortex(ctx) {
    //console.log(ctx);
    const gl = this.gl;
    const scale = this.scale;
    const prog_step = this.prog_step;
    const {
      positive,
      position: { x, y },
    } = ctx;
    gl.useProgram(prog_step);
    gl.uniform1i(
      gl.getUniformLocation(prog_step, "addVortex"),
      positive ? 1 : -1
    );
    gl.uniform1f(gl.getUniformLocation(prog_step, "addVortex_x"), x / scale);
    gl.uniform1f(
      gl.getUniformLocation(prog_step, "addVortex_y"),
      (scale - y) / scale
    );
  }

  spawnVortexPair(ctx) {
    //console.log(ctx);
    const { a, b } = ctx;
    this.spawnVortex({ positive: true, position: a });
    setTimeout(() => {
      //console.log(b);
      this.spawnVortex({ positive: false, position: b });
    }, 10);
  }

  addObstacle(ctx) {
    const gl = this.gl;
    const scale = this.scale;
    const prog_rk4 = this.prog_rk4;
    const {
      position: { x, y },
    } = ctx;
    gl.useProgram(prog_rk4);
    gl.uniform1i(gl.getUniformLocation(prog_rk4, "addPot"), 1);
    gl.uniform1f(gl.getUniformLocation(prog_rk4, "addPot_x"), x / scale);
    gl.uniform1f(
      gl.getUniformLocation(prog_rk4, "addPot_y"),
      (scale - y) / scale
    );
  }

  removeObstacle = () => {
    this.gl.useProgram(this.prog_rk4);
    this.gl.uniform1i(this.gl.getUniformLocation(this.prog_rk4, "addPot"), 0);
  };

  resize = () => {
    this.scale =
      (window.innerHeight < window.innerWidth
        ? window.innerHeight / 1.1
        : window.innerWidth) / 1.1;
    this.canvas.style.height = this.scale + "px";
  };
  
  getPair = () => {
    return this.opts.vortexPair;
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.scale = 800;
    canvas.style.height = this.scale + "px";
    const gl = (this.gl = canvas.getContext("webgl"));

    // Set initial simulation parameters
    const n = 256;
    this.opts = {
      addPot: {
        active: false,
        x: 0,
        y: 0,
        r: 2,
      },
      addSlits: {
        active: false,
        w: 0,
        s: 0,
      },
      addTrap: false,
      addVortex: {
        active: false,
        positive: true,
        x: 0,
        y: 0,
        angular_momentum: 0,
      },
      vortexPair: {
        active: false,
        x: 0.15,
        y: 0.15,
        delay: 300,
      },
      boundary: "Reflective",
      preset: "Box",
      dt: 0.1,
      dx2: 0.5 * 0.5,
      gamma: 0.01,
      omega: 0,
      showPhase: false,
    };

    // Setup webgl shaders
    this.initShaders();

    // Setup webgl texture storage
    let tex;
    this.textures = tex = [
      gl.TEXTURE0,
      gl.TEXTURE1,
      gl.TEXTURE2,
      gl.TEXTURE3,
      gl.TEXTURE4,
      gl.TEXTURE5,
    ];
    const pix = new Uint8Array(4 * n * n);
    this.FBO_PSI1 = GPE.makeFBO(gl, tex[0], n, n, pix);
    this.FBO_PSI2 = GPE.makeFBO(gl, tex[1], n, n, pix);
    this.FBO_K1 = GPE.makeFBO(gl, tex[2], n, n, pix);
    this.FBO_K2 = GPE.makeFBO(gl, tex[3], n, n, pix);
    this.FBO_K3 = GPE.makeFBO(gl, tex[4], n, n, pix);
    this.FBO_K4 = GPE.makeFBO(gl, tex[5], n, n, pix);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
      console.log("FRAMEBUFFER not complete");

    this.spawnVortex = this.spawnVortex.bind(this);
    this.spawnVortexPair = this.spawnVortexPair.bind(this);
    this.resize = this.resize.bind(this);
    this.getPair = this.getPair.bind(this);
    this.ui = new UI(this);
  }
}
