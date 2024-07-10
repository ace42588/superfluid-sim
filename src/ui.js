export default class UI {
    constructor(ctx) {
		this.ctx = ctx;
        var gl = this.ctx.gl;
        var prog_show = this.ctx.prog_show;
        var prog_step = this.ctx.prog_step;
        var prog_rk4 = this.ctx.prog_rk4;

        // Add dat GUI to the DOM. Start full width and closed if on a narrow screen
        var gui = new dat.GUI({width: (window.innerWidth < 600)?window.innerWidth:320, autoPlace: false});
        if(window.innerWidth < 600) gui.close();
        document.getElementById('GUI').appendChild(gui.domElement);

        // Setup the dat GUI parameter controllers
        gui.add(this.ctx.opts, 'preset', ['Box', 'Trapped & Rotating', 'Random Vortices (Phase)', 'Double Slit']).name('Preset Parameters').onChange(function(value) {
            if(value == 'Box'){
                gl.useProgram(prog_rk4);
                gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addTrap'), 0);
                this.ctx.opts['addTrap'] = false;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'gamma'), 0.01);
                this.ctx.opts['gamma'] = 0.01;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'ang_mom'), 5);
                this.ctx.opts['omega'] = 0.0;
                gl.useProgram(prog_show);
                gl.uniform1i(gl.getUniformLocation(prog_show, 'showPhase'), false);
                this.ctx.opts['showPhase'] = false;
            } else if (value == 'Trapped & Rotating'){
                gl.useProgram(prog_rk4);
                gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addTrap'), 1);
                this.ctx.opts['addTrap'] = true;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'gamma'), 0.15);
                this.ctx.opts['gamma'] = 0.15;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'ang_mom'), 1.6 + 5);
                this.ctx.opts['omega'] = 1.6;
            } else if (value == 'Random Vortices (Phase)'){
                gl.useProgram(prog_rk4);
                gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addTrap'), 0);
                this.ctx.opts['addTrap'] = false;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'gamma'), 0.01);
                this.ctx.opts['gamma'] = 0.01;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'ang_mom'), 5);
                this.ctx.opts['omega'] = 0.0;
                gl.useProgram(prog_step);
                gl.uniform1i(gl.getUniformLocation(prog_step, 'randVort'), Math.floor(Math.random() * 256));
                gl.uniform1i(gl.getUniformLocation(prog_step, 'reset'), 1);
                gl.useProgram(prog_show);
                gl.uniform1i(gl.getUniformLocation(prog_show, 'showPhase'), true);
                this.ctx.opts['showPhase'] = true;
            } else if (value = 'Double Slit') {
				gl.useProgram(prog_rk4);
                gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addSlits'), 1);
                this.ctx.opts['addSlits']['active'] = true;
				gl.uniform1f(gl.getUniformLocation(prog_rk4, 'addSlits_w'), 0.2);
				this.ctx.opts['addSlits']['addSlits_w'] = 0.2;
				gl.uniform1f(gl.getUniformLocation(prog_rk4, 'addSlits_s'), 0.05);
				this.ctx.opts['addSlits']['addSlits_s'] = 0.05;
                gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addTrap'), 0);
                this.ctx.opts['addTrap'] = false;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'gamma'), 0.01);
                this.ctx.opts['gamma'] = 0.01;
                gl.uniform1f(gl.getUniformLocation(prog_rk4, 'ang_mom'), 5);
                this.ctx.opts['omega'] = 0.0;
                gl.useProgram(prog_show);
                gl.uniform1i(gl.getUniformLocation(prog_show, 'showPhase'), false);
                this.ctx.opts['showPhase'] = false;
			}
            for (var i in gui.__controllers) {
                gui.__controllers[i].updateDisplay();
            }
        }.bind(this));

        gui.add(this.ctx.opts, 'boundary', ['Periodic', 'Reflective']).name('Boundary Condition').onChange(
			this.ctx.changeBoundary.bind(this.ctx)
		);

        gui.add(this.ctx.opts, 'gamma', 0.0, 0.3).step(0.01).name('Dissipation').onChange(function(value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'gamma'), value);
        });

        gui.add(this.ctx.opts, 'dt', 0, 0.1).step(0.01).name('Time Step').onChange(function(value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'dt'), value);
        });

        gui.add(this.ctx.opts, 'omega', -2 , 2).step(0.05).name('Angular Momentum').onChange(function(value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'ang_mom'), value + 5);
        });

        gui.add(this.ctx.opts.addPot, 'r',0,30).step(0.1).name('Obstacle Radius').onChange(function(value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'addPot_r'), value);
        });

        gui.add(this.ctx.opts, 'addTrap').name('Enable Trap').onChange(function (value) {
            gl.useProgram(prog_rk4);
            gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addTrap'), value);
        });

        gui.add(this.ctx.opts, 'showPhase').name('Show Phase').onChange(function (value) {
            gl.useProgram(prog_show);
            gl.uniform1i(gl.getUniformLocation(prog_show, 'showPhase'), value);
        }); 
		
		gui.add(this.ctx.opts.addSlits, 'active').name('Enable Double Slit').onChange(function (value) {
            gl.useProgram(prog_rk4);
            gl.uniform1i(gl.getUniformLocation(prog_rk4, 'addSlits'), value);
        });
		
		gui.add(this.ctx.opts.addSlits, 'w', 0, 0.5).step(0.01).name('Slit Width').onChange(function (value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'addSlits_w'), value/2);
        });
		
		gui.add(this.ctx.opts.addSlits, 's', 0, 0.5).step(0.01).name('Slit Spacing').onChange(function (value) {
            gl.useProgram(prog_rk4);
            gl.uniform1f(gl.getUniformLocation(prog_rk4, 'addSlits_s'), value/2);
        });
		
		gui.add(this.ctx.opts.addVortex, 'angular_momentum', -10, 10).step(0.1).name('Vortex AngMom');
		
		gui.add(this.ctx.opts.vortexPair, 'x', 0, 0.5).step(0.01).name('Cannon Spacing');
		
		gui.add(this.ctx.opts.vortexPair, 'y', 0, 1).step(0.05).name('Cannon Y');
		
		gui.add(this.ctx.opts.vortexPair, 'delay', 250, 500).step(10).name('Cannon Delay');

        gui.add({
            quench:function(){ 
                gl.useProgram(prog_step);
                gl.uniform1i(gl.getUniformLocation(prog_step, 'quench'), 1);
            }
        }, 'quench').name('Quench Phase');

        gui.add({
            reset:function(){ 
                gl.useProgram(prog_step);
                gl.uniform1i(gl.getUniformLocation(prog_step, 'reset'), 1);
            }
        }, 'reset').name('Reset Simulation');

    }
}