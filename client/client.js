/*
+---------+  +---------+  +---------+
|name     |  |name     |  |name     |
|health   |  |health   |  |health   |
|numcards |  |numcards |  |numcards |
+---------+  +---------+  +---------+
+---------+  +---------+  +---------+
|name     |  |name     |  |name     |
|health   |  |health   |  |health   |
|numcards |  |numcards |  |numcards |
+---------+  +---------+  +---------+

+-------------------------------------+
|name     role     health     end turn|
+-------------------------------------+

+-------+ +-------+ +-------+ +-------+
|name   | |name   | |name   | |name   |
|ability| |ability| |ability| |ability|
+-------+ +-------+ +-------+ +-------+
+-------+ +-------+ +-------+ +-------+
|name   | |name   | |name   | |name   |
|ability| |ability| |ability| |ability|
+-------+ +-------+ +-------+ +-------+



Drag card from hand to player to use on player (if card to be used against others)
Otherwise drag card from hand to stats to use (on self or global)

Hover over role for info about role (tooltip?)

Click on card for more info (expand to fit screen?)

Press "end turn" to end turn
*/

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
const mainDiv = document.getElementById("main");
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
			main();
		},false);
	}
})();

async function main(){

let roleName = "KING,ADVISOR,TRAITOR,REBEL".split(',')[ROLE];
alert(NAME + ", you are now playing the game! Your role is " + roleName);
nameDisplaySpan.innerText += " Your role is " + roleName;


class CardList{
	static Card = class Card{
		/**
		 * @param cardName {String}
		 * @param description {String}
		 */
		constructor(cardName,description){
			this.cardName = cardName;
			let d = document.createElement("div");
			d.className = "card";
			let t = `【${cardName}】\n───────────────\n${description}`;
			d.innerText = t;
			this.div = d;
		}
	}
	constructor(){
		/** @type {HTMLDivElement} */
		this.div = document.createElement("div")
		this.div.className = "cardList"
		/** @type {CardList.Card[]} */
		this.cards = []
	}
	removeAllCards(){
		while(this.div.firstChild) this.div.removeChild(this.div.firstChild);
		this.cards = [];
	}
	addCard(cardName,description){
		let id = Math.random()
		let card = new CardList.Card(cardName,description);
		this.cards.push(card)
		this.div.appendChild(card.div)
	}
	/** @param cards {{name:String,description:String}[]}*/
	updateCards(cards){
		this.removeAllCards();
		cards.forEach(({cardName,description})=>this.addCard(cardName,description));
	}
	/**
	 * @param allowedCards {String[]}
	 * @returns {Promise<Number>}
	 */
	async getChosenCard(allowedCards){
		const self = this;
		return new Promise(resolve=>{
			window.onkeypress = ({key})=>{
				console.log("you pressed a code: " + key)
				if(key=="n"){
					this.clearCardClickEvent();
					this.clearDisabled();
					console.log("next player's turn");
					resolve("");
				}
			}
			let i = 0;
			for(let card of this.cards){
				const ind = i++;
				if(allowedCards.includes(card.cardName)){
					card.div.onmousedown = e=>{
						this.clearCardClickEvent();
						this.clearDisabled();
						resolve(ind);
					}
					card.div.dataset["disabled"] = false;
				}
			}
		})
	}

	clearCardClickEvent(){
		for(let card of this.cards) card.div.onmousedown = e=>0;
	}
	clearDisabled(){
		for(let card of this.cards) card.div.dataset["disabled"] = true;
	}
}

let cardList = new CardList();
mainDiv.appendChild(cardList.div)

socket.on('updateCards',/**@param data {String[]}*/function(data){
	cardList.updateCards(data.map(JSON.parse));
});
socket.on('requestCard',async data=>{
	infoSpan.innerText = "It's your turn! Play a card";
	let card = (await cardList.getChosenCard(data.split("|"))).toString();
	socket.emit("gaveCard",card)
	infoSpan.innerText = "";
},false)

}