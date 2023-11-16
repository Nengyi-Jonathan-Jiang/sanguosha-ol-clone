function initGame(callback){

class SocketWrapper {
	constructor(socket) {
		this.socket = socket;
		/** @type {Map<String,(data:String)=>any>} */
		this.events = new Map()
	}

	/**
	 * @param eventName {String} @param data {String}
	 */
	emit(eventName, data) {
		this.socket.emit(eventName, data)
	}

	/**
	 * @param eventName {String}
	 * @param func {(data:String)=>any}
	 * @param parseJSON {boolean}
	 */
	on(eventName, func, parseJSON=true) {
		if (!this.events.has(eventName))
			this.socket.on(eventName, data => this.events.get(eventName)(data));

		if(parseJSON)
			this.events.set(eventName, data=>func(JSON.parse(data)))
		else
			this.events.set(eventName, func)
	}
	
	/**
	 * @param eventName {String}
	 */
	clearEvent(eventName) {
		this.events.set(eventName, _ => 0)
	}
}

var socket = new SocketWrapper(io());

/**@type {HTMLDivElement}*/
const mainDiv = document.getElementById("content");
/**@type {HTMLDivElement}*/
const nameDisplaySpan = document.getElementById("nameDisplay");
/**@type {HTMLDivElement}*/
const infoSpan = document.getElementById("info");

let NAME = "", ROLE = "";
(_=>{
	/**@type {HTMLDivElement}*/
	const nameDiv = document.getElementById("enterName");
	/**@type {HTMLInputElement}*/
	const nameInput = document.getElementById("name");
	/**@type {HTMLDivElement}*/
	const gameDiv = document.getElementById("Games");
	/**@type {HTMLDivElement}*/
	const gameListDiv = document.getElementById("gameList");
	/**@type {HTMLInputElement}*/
	const createGame = document.getElementById("createGameName")

	const playersDiv = document.getElementById("players");
	/**@type {HTMLDivElement}*/
	const playersListDiv = document.getElementById("playersList");
	/**@type {HTMLButtonElement}*/
	const gameStartBtn = document.getElementById("gameStart");

	nameInput.onkeypress = e => {
		if(e.keyCode != 13) return;
		socket.emit("setName",nameInput.value);
		nameDiv.style.setProperty("display","none");
		gameDiv.style.setProperty("display","initial");
		document.getElementById("top-div").style.setProperty("display","block");
		socket.emit("requestGameList");

		nameDisplaySpan.innerText = "Hello, " + nameInput.value + "!";

		socket.on("updateName", data=>{
			NAME = data;
			nameDisplaySpan.innerText = "Hello, " + NAME + "!";
		},false);

		nameInput.onkeypress = ()=>{}

		createGame.onkeypress = e => {
			if(e.keyCode != 13) return;
			socket.emit("requestCreateGame",createGame.value);
			gameDiv.style.setProperty("display","none");
			socket.on("joinedGame",_=>{
				socket.clearEvent("joinedGame");
				socket.clearEvent("updateGameList");
				socket.clearEvent("updateName")
				awaitGameStart();
			});
			createGame.onkeypress = _=>0;
		}

		socket.on("updateGameList",
			/**@param data {{name:String,players:String[]}[]}*/
			data=>{
				console.log("received game list: ", data);
			while(gameListDiv.firstChild) gameListDiv.removeChild(gameListDiv.firstChild)
			if(!data.length){
				let s = document.createElement("span");
				s.innerText = `[None]`;
				gameListDiv.appendChild(s);
			}
			else{
				for(let game of data){
					let {name,players} = game;
					let s = document.createElement("div");
					s.innerText = `Game: ${name}\nPlayers:${players.toString()}`;
					s.onclick = _=>{
						gameDiv.style.setProperty("display","none");
						socket.clearEvent("updateGameList");
						createGame.onkeypress = _=>0;
						socket.emit("requestJoinGame",name)
						socket.on("joinedGame",_=>{
							socket.clearEvent("joinedGame");
							socket.clearEvent("updateName")
							awaitGameStart()
						});
					}
					gameListDiv.appendChild(s);
				}
			}
		})
	}


	function awaitGameStart(){
		playersDiv.style.setProperty("display","initial");
		socket.on("updatePlayerList",/**@param data {String[]}*/data=>{
			while(playersListDiv.firstChild) playersListDiv.removeChild(playersListDiv.firstChild)
			if(data == []){
				let s = document.createElement("span");
				s.innerText = `[None]`;
				playersListDiv.appendChild(s);
			}
			else{
				for(let name of data){
					let s = document.createElement("div");
					s.innerText = name + (name == NAME ? " (you)" : "");
					playersListDiv.appendChild(s);
				}
			}
		});
		gameStartBtn.onclick = _=>{
			socket.emit("requestStartGame");
		}
		socket.on("startGame",role=>{
			ROLE = role;
			mainDiv.style.setProperty("display","flex");
			playersDiv.style.setProperty("display","none");
			socket.clearEvent("updatePlayerList")
			socket.clearEvent("startGame")
			main(socket,NAME,ROLE);
		},false);
	}
})();

}