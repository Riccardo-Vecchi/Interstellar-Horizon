
var animationId;
var tickId;
var audios = {};
var obstacles = [];
var obstaclesPool = [];
var helpers;
var helpersPool = [];
var obstaclesMaterials = [];
var blackHole;

var scene;
var camera;
var renderer;

var fovy = 60;
var near = 0.1;
var far = 1000;

const black = 0x000000;
const white = 0xffffff;
const green = 0x00ff00; 
const blue = 0x0080ff; 
const yellow = 0xffff00;
const orange = 0xffaa00;

const keyESC = 27;
const keyM = 77;
const keyW = 87;
const keyS = 83;
const keyA = 65;
const keyD = 68;
const keyR = 82;
const keySpace = 32;

var dashboardElement = document.getElementById("dashboard");
var pointsElement = document.getElementById("points");
var finalPointsTextElement = document.getElementById("finalPointsText")
var lifeBarElement = document.getElementById("lifeBar");
var laserBarElement = document.getElementById("laserBar");
var warpSpeedBarElement = document.getElementById("warpSpeedBar");
var muteImageElement = document.getElementById("muteDiv");
var gameOverSplashElement = document.getElementById("gameOverSplash");

particleSystems = { 
					list:[],
					dirs:[],
					movementSpeed:2,
					totalObjects:400,
					objectSize:0.05,
					maxNumberOfSystems:2,
					
					update: function () {
						
						while (particleSystems.list.length > this.maxNumberOfSystems)
							this.list.shift().remove();
						
						for(i = 0; i < particleSystems.list.length; i++)
							this.list[i].update();
						
					}
				};	
				
					
function initGame() {
	
	gameStatus = {
					points:0,
					maxNumberOfObstacles:500,
					pointsPerObstaclesHit:1000,
					damagePerCollision:15,
					maxNumberOfHelpers:20,
					tickTime:30,
					pointsPerTick:1,
					blackHoleProbabilityPerTick:0.001,
					helpersProbabilityPerTick:0.1,
					blackHoleAttraction:0.2,
					enableSound:true,
					gameOver:false	
				};
	
	spaceship = { 
					model:spaceshipModel, 
					life:100, 
					maxLife:100,
					lifeRegeneration:0.05,
					laser: null,
					laserMunitions:100,
					maxLaserMunitions:100,
					laserDamage:1,
					laserRegeneration:0.1,
					speed:3.5,
					basicSpeed:3.5,
					warpSpeed:22.0,
					warpCharge:100,
					maxWarpCharge:100,
					translationStep:0.3,
					rotationStep:THREE.Math.degToRad(13),
					basicPropulsorIntensity:256,
					warpSpeedPropulsorIntensity:600,
					isMoving:false 
				};
				
	spaceship.laser = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: green } ) );	
	
	
	if(!scene) {
		scene = new THREE.Scene();
		scene.background = backgroundImageTexture;	
	}
				
				
	if(!camera) {
		camera = new THREE.PerspectiveCamera( fovy, window.innerWidth / window.innerHeight, near, far );
		camera.position.set( 0.0, 0.0, -10.0 );
		camera.lookAt( 0.0, 0.0, 0.0 );
	}
	
	if(!renderer) {
		renderer = new THREE.WebGLRenderer( { antialias:true, powerPreference:"high-performance" } );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.append( renderer.domElement );
	}			
	
	spaceship.model.position.set(0.0, 0.0, 0.0);	
	lights.position.set(-40.0, 10.0, 0.0);
	
	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	stats.domElement.style = "position: absolute; left:0px; bottom:0px;"
	document.body.appendChild( stats.domElement );
	
	dashboardElement.style.display = "block";
	
	eventQueue = [];
	
	obstacles = [];
	
	helpers = [];
	
	blackHole = undefined;	
	
	camera.add(listener);
	
	scene.add(spaceship.model);
	scene.add(lights);	
		
	playAudioIfPossible(audios['backgroundSound']);
	
	animate();
	
	addControls();
	
	tick();

}


function addControls() {

	window.addEventListener( "resize", adaptGameResize, false );
	document.addEventListener( "keydown", manageKeyDown, false );
	document.addEventListener( "keyup", manageKeyUp, false );
	document.addEventListener( "mousedown", generateLaser, false );
	
}


function loadObjects(loadManager) {
	
	var textureLoader = new THREE.TextureLoader(loadManager);

	backgroundImageTexture = textureLoader.load("images/universe_background.jpg");
	lightSpeedTexture = textureLoader.load("images/travel-at-light-speed.jpg");
	lensFlareTexture = textureLoader.load("images/lensflare.jpg");
	
	var asteroidTexture1 = textureLoader.load("images/Map__4_Mix.png");
	var asteroidTexture2 = textureLoader.load("images/Map__15_Noise.png");
	var asteroidTexture3 = textureLoader.load("images/Map__12_Cellular.png");
	var asteroidTexture4 = textureLoader.load("images/Volcanic.png");
	var asteroidTexture5 = textureLoader.load("images/Martian.png");
	
	obstaclesMaterials = [ new THREE.MeshPhongMaterial( {map: asteroidTexture1} ),
						   new THREE.MeshPhongMaterial( {map: asteroidTexture2} ),
						   new THREE.MeshPhongMaterial( {map: asteroidTexture3} ),
						   new THREE.MeshPhongMaterial( {map: asteroidTexture4} ),
						   new THREE.MeshPhongMaterial( {map: asteroidTexture5} ) ];
	
	
	var objectLoader = new THREE.ObjectLoader(loadManager);
		
	objectLoader.load( "models/spaceships/spaceship.json", function (obj) { 
																			lights = obj.children[0]; 
																			spaceshipModel = obj.children[1]; 
																			
																			var shield = new THREE.Mesh( new THREE.SphereBufferGeometry(2,32,16), new THREE.MeshBasicMaterial( { color: orange, wireframe: true } ) );
																			shield.name = "shield";
																			
																			propulsor = new THREE.Lensflare();
																			propulsor.flame = new THREE.LensflareElement( lensFlareTexture );
																			propulsor.addElement( propulsor.flame );
																			propulsor.position.y += 1.4;
																			
																			spaceshipModel.add(propulsor);
																			spaceshipModel.add(shield); } );
		
		
	var audioLoader = new THREE.AudioLoader(loadManager);
	listener = new THREE.AudioListener();
	
	audios['laserSound'] = new THREE.Audio( listener );
	audioLoader.load( "sounds/laser-beam-phaser.mp3", function( buffer ) {	audios['laserSound'].setBuffer( buffer ); } );
		
	audios['helperSound'] = new THREE.Audio( listener );
	audioLoader.load( "sounds/helper-sound.mp3", function( buffer ) { 		audios['helperSound'].setBuffer( buffer ); } );
																			
	audios['dangerSound'] = new THREE.Audio( listener );		
	audioLoader.load( "sounds/danger.mp3", function( buffer ) { 			audios['dangerSound'].setBuffer( buffer ); } );	
	
	audios['explosionSound'] = new THREE.Audio( listener );		
	audioLoader.load( "sounds/explosion.mp3", function( buffer ) { 			audios['explosionSound'].setBuffer( buffer ); } );	
	
	audios['speedLightSound'] = new THREE.Audio( listener );																			
	audioLoader.load( "sounds/speedlight.mp3", function( buffer ) { 		audios['speedLightSound'].setBuffer( buffer ); } );
	
	audios['gameOverSound'] = new THREE.Audio( listener );																			
	audioLoader.load( "sounds/game-over.mp3", function( buffer ) { 			audios['gameOverSound'].setBuffer( buffer ); 
																			audios['gameOverSound'].setLoop(true); } );
																			
	audios['backgroundSound'] = new THREE.Audio( listener );																			
	audioLoader.load( "sounds/background.mp3", function( buffer ) { 		audios['backgroundSound'].setBuffer( buffer ); 
																			audios['backgroundSound'].setLoop(true); } );
																			
	for(audio in audios) 
		if( audios.hasOwnProperty(audio) ) audios[audio].setVolume(0.5);
																													
}


function clearScene() {
	
    var toRemove = [];

    scene.traverse ( function( child ) {
        if ( child instanceof THREE.Mesh && !child.userData.keepMe === true )
            toRemove.push( child );
    } );

    for ( var i = 0; i < toRemove.length; i++ ) {
		toRemove[i].geometry.dispose();
        scene.remove( toRemove[i] );
	}

}


function tick() {
	
	if(!gameStatus.gameOver) {
			
		deQueueEvents();

		updateSpaceship();

		detectCollision();
	
		pointsElement.innerHTML = gameStatus.points;
		
		gameStatus.points += gameStatus.pointsPerTick;
		
	}
	
	particleSystems.update();	

	generateObstacles();
		
	generateHelpers();
	
	generateBlackHole();

	moveEntities();
	
	tickId = setTimeout(tick, gameStatus.tickTime);
	
}


function animate() {
	
	stats.begin();
	
	animationId = requestAnimationFrame( animate );
	
	renderer.render( scene, camera );
	
	stats.end();

}


function updateSpaceship() {
	
	updateDashboard();
	
	if(blackHole) blackHole.attract(spaceship.model);
	
	if( !spaceship.isMoving ) { 
		spaceship.model.rotation.y /= 2;
		spaceship.model.rotation.x  = -THREE.Math.degToRad(90);
		spaceship.model.position.z /= 1.1;
	}
	
	if(spaceship.model.getObjectByName("shield").visible === true) {
		setTimeout( function() { spaceship.model.getObjectByName("shield").visible = false; }, gameStatus.tickTime);
	}
	
	if(spaceship.speed != spaceship.warpSpeed)
		propulsor.flame.size = THREE.Math.randInt(1,10) < 10 ?  spaceship.basicPropulsorIntensity : spaceship.basicPropulsorIntensity/2;
	
	// If off-screen, attract spaceship to the screen
	var pos = spaceship.model.position.clone();
	pos.project(camera);
	pos.x = window.innerWidth/2 * ( pos.x + 1 );
	pos.y = window.innerHeight/2 * ( pos.y + 1 );
	
	if( pos.x < 0 || pos.x > window.innerWidth) spaceship.model.position.x *= 0.98; 
	if( pos.y < 0 || pos.y > window.innerHeight) spaceship.model.position.y *= 0.98; 
	
}


function updateDashboard() {
	
	// Life update
	if(spaceship.life <= 0) gameOverManager();
	
	else if(spaceship.life < spaceship.maxLife)
		spaceship.life += spaceship.lifeRegeneration;
	
	normalizedLife = (spaceship.life / spaceship.maxLife)*100; 		
		
	// Laser update
	if(spaceship.laserMunitions < spaceship.maxLaserMunitions) 
		spaceship.laserMunitions += spaceship.laserRegeneration;
	
	normalizedLaser = (spaceship.laserMunitions / spaceship.maxLaserMunitions)*100;	
	
	// Warp speed update
	normalizedWarpSpeed = (spaceship.warpCharge / spaceship.maxWarpCharge)*100;
	
	
	lifeBarElement.style = "background: linear-gradient(90deg, #66ff66 " + normalizedLife + "%, rgba(0,0,0,0) 0%);";
	laserBarElement.style = "background: linear-gradient(90deg, #0080ff " + normalizedLaser + "%, rgba(0,0,0,0) 0%);";
	warpSpeedBarElement.style = "background: linear-gradient(90deg, #ffff00 " + normalizedWarpSpeed + "%, rgba(0,0,0,0) 0%);";	
		
}


function warpSpeed(disable = false) {
	
	if( spaceship.warpCharge == 0 || disable ) {
		
		propulsor.flame.size = spaceship.basicPropulsorIntensity;
		spaceship.speed = spaceship.basicSpeed;
		scene.background = backgroundImageTexture;
		if(audios['speedLightSound'].isPlaying) audios['speedLightSound'].stop();
		
		return;
		
	}
	
	spaceship.warpCharge--;
	
	propulsor.flame.size = spaceship.warpSpeedPropulsorIntensity;
	
	spaceship.speed = spaceship.warpSpeed; 
	scene.background = lightSpeedTexture; 
	
	playAudioIfPossible(audios['speedLightSound']); 

}


function muteUnmuteSounds() {
	
	gameStatus.enableSound = !gameStatus.enableSound;
	
	muteImageElement.style.display = gameStatus.enableSound ? "none" : "block";

	for (var audio in audios ) {
		if( audios.hasOwnProperty(audio) )
			audios[audio].setVolume(gameStatus.enableSound ? 0.5 : 0.0);
	}
	
}


function playAudioIfPossible(audio) {
	
	if(gameStatus.enableSound && !audio.isPlaying)
		audio.play();
	
}

			
function deQueueEvents() {

	spaceship.isMoving = true;

	for ( i = 0; i < eventQueue.length; i++ ) {
	
	    if (eventQueue[i] === "space")      { warpSpeed(); } // Space
		else if (eventQueue[i] === "up")    { spaceship.model.position.y += spaceship.translationStep; if(spaceship.model.rotation.x+THREE.Math.degToRad(90) > -spaceship.rotationStep) spaceship.model.rotation.x -= spaceship.rotationStep; } // W
		else if (eventQueue[i] === "down")  { spaceship.model.position.y -= spaceship.translationStep; if(spaceship.model.rotation.x+THREE.Math.degToRad(90) < spaceship.rotationStep) spaceship.model.rotation.x += spaceship.rotationStep; } // S
		else if (eventQueue[i] === "left")  { spaceship.model.position.x += spaceship.translationStep; if(spaceship.model.rotation.y < spaceship.rotationStep) spaceship.model.rotation.y += spaceship.rotationStep; } // A
		else if (eventQueue[i] === "right") { spaceship.model.position.x -= spaceship.translationStep; if(spaceship.model.rotation.y > -spaceship.rotationStep) spaceship.model.rotation.y -= spaceship.rotationStep; } // D
			
	}
	
	if(eventQueue.length == 0) spaceship.isMoving = false;

}


function adaptGameResize(event) {
	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	
}


function manageKeyDown(event) {

	switch(event.which) {
		
		case keyESC: event.preventDefault(); window.location.reload(false); break; 
		case keyM: muteUnmuteSounds(); break; 
		case keyR: if( gameStatus.gameOver ) restartGame(); break;
		
		case keyW: if (eventQueue.length < 2 && eventQueue[0] != "up" ) { if(eventQueue[0] == "down") eventQueue.pop(); eventQueue.push("up"); } break;
		case keyS: if (eventQueue.length < 2 && eventQueue[0] != "down" ) { if(eventQueue[0] == "up") eventQueue.pop(); eventQueue.push("down"); } break;
		case keyA: if (eventQueue.length < 2 && eventQueue[0] != "left" ) { if(eventQueue[0] == "right") eventQueue.pop(); eventQueue.push("left"); } break;
		case keyD: if (eventQueue.length < 2 && eventQueue[0] != "right" ) { if(eventQueue[0] == "left") eventQueue.pop(); eventQueue.push("right"); } break;
		case keySpace: if (eventQueue.length < 2 && eventQueue[0] != "space" ) eventQueue.push("space"); break;
	
	}
	
}
		
		
function manageKeyUp(event) {
	
	eventQueue.splice(eventQueue[0] ? 0 : 1, 1);
	
	if(event.which === keySpace) warpSpeed(true); 

}


function generateLaser(event) {
	
	event.preventDefault();

	if(gameStatus.gameOver || spaceship.laserMunitions <= 0 ) 
		return;	
	
	spaceship.laserMunitions--;

	var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );

	vector.unproject( camera );

	var dir = vector.sub( camera.position ).normalize();

	var distance = -camera.position.z / dir.z;

	var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );	

	spaceship.laser.geometry.setFromPoints([spaceship.model.position, pos]);
	spaceship.laser.geometry.verticesNeedUpdate = true;

	scene.add(spaceship.laser);
		
	setTimeout(releaseLaser, gameStatus.tickTime);
	
	playAudioIfPossible(audios['laserSound']);	
	
	detectHit(event, pos);
	
}	


function releaseLaser() {

	scene.remove(spaceship.laser);
	
}


function generateHelpers() {
	
	var help, helper;

	if( helpers.length < gameStatus.maxNumberOfHelpers && Math.random() < gameStatus.helpersProbabilityPerTick ) {
		
		help = THREE.Math.randInt(1, 3);
		luck = THREE.Math.randFloat(0.1, 0.3);
		
		if(helpersPool.length == 0)
			helper = new THREE.Mesh( new THREE.BoxBufferGeometry(5, 5, 5), new THREE.MeshPhongMaterial() );
		else 
			helper = helpersPool.shift();
			
		switch(help) {
			
			case 1: 
					helper.material.color = new THREE.Color( green );
					helper.life = Math.round(spaceship.maxLife*luck); helper.laser = 0; helper.warpCharge = 0; 
					break;
			
			case 2: helper.material.color = new THREE.Color( blue );
					helper.life = 0; helper.laser = Math.round(spaceship.maxLaserMunitions*luck); helper.warpCharge = 0;
					break;
			
			case 3: helper.material.color = new THREE.Color( yellow );
					helper.life = 0; helper.laser = 0; helper.warpCharge = Math.round(spaceship.maxWarpCharge*luck);
					break;
			
		}
					
		helper.position.x = THREE.Math.randFloatSpread(100);
		helper.position.y = THREE.Math.randFloatSpread(100);
		helper.position.z = THREE.Math.randFloat(200, far);
		
		helpers.push(helper);
		scene.add(helper);
	
	}	
	
}


function generateObstacles() {
	
	var obstacle, dimension;

	while ( obstacles.length < gameStatus.maxNumberOfObstacles ) {
	
		dimension = THREE.Math.randInt(1, 9);
		
		if(obstaclesPool.length == 0)
			obstacle = new THREE.Mesh( new THREE.SphereBufferGeometry(dimension), obstaclesMaterials[THREE.Math.randInt(0,obstaclesMaterials.length-1)] );
		else 
			obstacle = obstaclesPool.shift();

		obstacle.position.x = THREE.Math.randFloatSpread(300);
		obstacle.position.y = THREE.Math.randFloatSpread(300);
		obstacle.position.z = THREE.Math.randFloat(200, far);
		
		obstacle.life = THREE.Math.randInt(1, dimension/2);
		obstacle.speed = THREE.Math.randFloat(0, 2);
	
		obstacles.push(obstacle);
		scene.add(obstacle);
		
	}

}		


function generateBlackHole() {
	
	if ( blackHole == undefined && Math.random() < gameStatus.blackHoleProbabilityPerTick ) {
		
		blackHole = new THREE.Mesh( new THREE.SphereBufferGeometry( 12 ), new THREE.MeshPhongMaterial({ color: black }) );
		
		blackHole.position.x = THREE.Math.randFloatSpread(30);
		blackHole.position.y = THREE.Math.randFloatSpread(30);
		blackHole.position.z = THREE.Math.randFloat(200, far);
		
		blackHole.attraction = gameStatus.blackHoleAttraction;
		
		scene.add(blackHole);
		
		blackHole.attract = function(object) {
	
			(object.position.x > blackHole.position.x) ? object.position.x -= blackHole.attraction : object.position.x += blackHole.attraction;
	
			(object.position.y > blackHole.position.y) ? object.position.y -= blackHole.attraction : object.position.y += blackHole.attraction;
	
			(object.position.z > blackHole.position.z) ? object.position.z -= blackHole.attraction : object.position.z += blackHole.attraction;
	
		}
		
		playAudioIfPossible(audios['dangerSound']);
		
	}
	
}


function moveEntities() {
	
	if(blackHole) {
		blackHole.position.z -= spaceship.speed;
		if(blackHole.position.z < near-20 ) {
			scene.remove(blackHole);
			blackHole.geometry.dispose();
			blackHole = undefined;	
		}			
	}

	for(i = 0; i < obstacles.length; i++) {
		
		obstacles[i].position.z -= (spaceship.speed + obstacles[i].speed);
		
		if(blackHole) blackHole.attract(obstacles[i]);

		if(obstacles[i].position.z < near) {			
			scene.remove(obstacles[i]);		
			obstaclesPool.push(obstacles[i]);			
			obstacles.splice(i,1);
			
		}
	}
	
	for(i = 0; i < helpers.length; i++) {
		
		helpers[i].position.z -= spaceship.speed;
		helpers[i].rotation.x = helpers[i].rotation.y += 0.1;

		if(helpers[i].position.z < near) {
			scene.remove(helpers[i]);
			helpersPool.push(helpers[i]);
			helpers.splice(i,1);
		}
	}
		
}


function detectCollision() {
	
	var direction = new THREE.Vector3(0.0, 0.0, 0.5);
	
	var raycaster = new THREE.Raycaster( spaceship.model.position, direction );
	
	var intersects = raycaster.intersectObjects( scene.children );
	
	
	if( intersects.length > 0 ) {
		
		firstObjIntersected = intersects[0].object;
		
		if( blackHole === firstObjIntersected ) {
			blackHole.geometry.dispose();
			gameOverManager();
			return;
		}
		
		for( var i = 0; i < helpers.length; i++ ) {
			
			if ( helpers[i] === firstObjIntersected ) {
				
				spaceship.life = Math.min(spaceship.life + helpers[i].life, spaceship.maxLife);
				spaceship.laserMunitions = Math.min(spaceship.laserMunitions + helpers[i].laser, spaceship.maxLaserMunitions);
				spaceship.warpCharge = Math.min(spaceship.warpCharge + helpers[i].warpCharge, spaceship.maxWarpCharge);
						
				scene.remove(helpers[i]);
				helpersPool.push(helpers[i]);
				helpers.splice(i,1);
				playAudioIfPossible(audios['helperSound']);
				return;
			}
			
		}
		
		for( var i = 0; i < obstacles.length; i++ ) {
			
			if ( obstacles[i] === firstObjIntersected ) {
				
				spaceship.life -= gameStatus.damagePerCollision;
				
				scene.remove(obstacles[i]);
				obstaclesPool.push(obstacles[i]);
				obstacles.splice(i,1);
				spaceship.model.getObjectByName("shield").visible = true;
				playAudioIfPossible(audios['explosionSound']);			
				return;
				
			}
			
		}
		
	}
		
}


function detectHit(event, pos) {

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	
	raycaster.setFromCamera( mouse, camera );
	
	var intersects = raycaster.intersectObjects( obstacles );
	
	if( intersects.length > 0 ) {
		
		firstObjIntersected = intersects[0].object;
		
		for( var i = 0; i < obstacles.length; i++ ) {
			
			if ( obstacles[i] === firstObjIntersected ) {
				
				particleSystems.list.push(new ExplodeAnimation( pos.x, pos.y, spaceship.model.position.distanceTo(obstacles[i]).z ) );	
				obstacles[i].life -= spaceship.laserDamage;
				
				if( obstacles[i].life <= 0 ) {
					scene.remove(obstacles[i]);	
					obstaclesPool.push(obstacles[i]);
					obstacles.splice(i,1);
					gameStatus.points += gameStatus.pointsPerObstaclesHit;
				}
				return;
			}
		
		}
		
	}
		
}


function gameOverManager() {
	
	gameStatus.gameOver = true;
	if(audios['backgroundSound'].isPlaying) audios['backgroundSound'].stop();
	playAudioIfPossible(audios['gameOverSound']);
	
	scene.remove(lights);
	scene.remove(spaceship.model)
	
	finalPointsTextElement.innerHTML = "You have totalized " + gameStatus.points + " points!";
	gameOverSplashElement.style.display = "block";
	
}


function restartGame() {
	
	gameOverSplashElement.style.display = "none"; 
	if(audios['gameOverSound'].isPlaying) audios['gameOverSound'].stop(); 
	clearTimeout(tickId); 
	clearScene(); 
	cancelAnimationFrame( animationId ); 
	initGame();
	
}
	
	
function ExplodeAnimation(x,y,z) {
	
	var geometry = new THREE.Geometry();
	
	for (var i = 0; i < particleSystems.totalObjects; i++) { 
		
		var vertex = new THREE.Vector3(x, y, z);
  
		geometry.vertices.push( vertex );
		particleSystems.dirs.push( { 
									x: THREE.Math.randFloatSpread(particleSystems.movementSpeed),
									y: THREE.Math.randFloatSpread(particleSystems.movementSpeed),
									z: THREE.Math.randFloatSpread(particleSystems.movementSpeed) } );
	}
  
	this.particles = new THREE.Points( geometry, new THREE.PointsMaterial( { size: particleSystems.objectSize } ) ); // Particle System 
  
	scene.add( this.particles ); 
  
	this.update = function(){
		var pCount = particleSystems.totalObjects;
		while(pCount--) {
			var particle = this.particles.geometry.vertices[pCount];
			particle.x += particleSystems.dirs[pCount].x;
			particle.y += particleSystems.dirs[pCount].y;	
			particle.z += particleSystems.dirs[pCount].z;
		}
		this.particles.geometry.verticesNeedUpdate = true;
	}
	
	this.remove = function() {
		scene.remove(this.particles);
		this.particles.geometry.dispose();
	}

}	
