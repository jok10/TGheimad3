/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Ferningur skoppar um gluggann.  Notandi getur breytt
//     hraðanum með upp/niður örvum.
//
//    Hjálmtýr Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var mouseX;
var movement = false;

// Núverandi staðsetning miðju ferningsins
var box = vec2( 0.0, 0.0 );

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

// Hálf breidd/hæð ferningsins
var boxRad = 0.05;

// Ferningurinn er upphaflega í miðjunni
var vertices = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05]);

var verticesPaddle = [
    vec2( -0.15, -0.9 ),
    vec2( -0.15, -0.86 ),
    vec2(  0.15, -0.86 ),
    vec2(  0.15, -0.9 )
];

var bufferIdBox, bufferIdPaddle, vPosition, locBox;


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    // Gefa ferningnum slembistefnu í upphafi
    dX = Math.random()*0.1-0.05;
    dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    bufferIdBox = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferIdBox);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

    bufferIdPaddle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferIdPaddle);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verticesPaddle), gl.DYNAMIC_DRAW);

    canvas.addEventListener("mousedown", function(e){
    movement = true;
    mouseX = e.offsetX;
    });

    canvas.addEventListener("mouseup", function(){
        movement = false;
    });

    canvas.addEventListener("mousemove", function(e){
        if (movement) {
            var xmove = 2 * (e.offsetX - mouseX) / canvas.width;
            mouseX = e.offsetX;
            for (var i = 0; i < 4; i++) {
                verticesPaddle[i][0] += xmove;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferIdPaddle);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(verticesPaddle));
        }
    });


    // Associate out shader variables with our data buffer

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    locBox = gl.getUniformLocation( program, "boxPos" );

    // Meðhöndlun örvalykla
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                dX *= 1.1;
                dY *= 1.1;
                break;
            case 40:	// niður ör
                dX /= 1.1;
                dY /= 1.1;
                break;
        }
    } );

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniform2fv(locBox, flatten(vec2(0.0, 0.0)));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferIdPaddle);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    
    // Láta ferninginn skoppa af veggjunum
    if (Math.abs(box[0] + dX) > maxX - boxRad) dX = -dX;
    if (Math.abs(box[1] + dY) > maxY - boxRad) dY = -dY;

    
    var paddleTop = verticesPaddle[1][1];    // y of top edge (-0.86)
    var paddleBottom = verticesPaddle[0][1]; // y of bottom edge (-0.9)
    var paddleLeft = verticesPaddle[0][0];
    var paddleRight = verticesPaddle[2][0];

    var boxLeft = box[0] - boxRad;
    var boxRight = box[0] + boxRad;
    var boxBottom = box[1] - boxRad;


    if (boxBottom <= paddleTop && boxBottom >= paddleBottom &&
        boxRight >= paddleLeft && boxLeft <= paddleRight) {
        dY = Math.abs(dY); // make sure we bounce upward
    }


    // Uppfæra staðsetningu
    box[0] += dX;
    box[1] += dY;
    
    

    gl.uniform2fv(locBox, flatten(box));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferIdBox);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    window.requestAnimFrame(render);
}
