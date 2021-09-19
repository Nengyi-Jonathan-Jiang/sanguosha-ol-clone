const express = require('express'), app = express(), serv = require('http').Server(app);
app.get('/',(req, res)=>res.sendFile(__dirname + '/client/index.html'));
app.use('/client',express.static(__dirname + '/client'));
app.use('/files',express.static(__dirname));
serv.listen(process.env.PORT);

function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

console.log("Server started");

/** @type {Map<String,Game>} */
var GAME_LIST = new Map();
function getAvailableGames(){
	return [...GAME_LIST.values()].filter(i=>!i.started)
}
/** @type {Map<String,Player>} */
var PLAYER_LIST = new Map();
//^^These are the lists that keep track of the players and connected clients

class SocketWrapper{constructor(socket){this.socket = socket; /** @type {Map<String,(data:String)=>any>} */ this.events = new Map()} /** @param eventName {String} @param data {String} */ emit(eventName,data){this.socket.emit(eventName,data)} /** @param eventName {String} @param func {(data:String)=>any} */ on(eventName,func){if(!this.events.has(eventName)) this.socket.on(eventName,data=>this.events.get(eventName)(data)); this.events.set(eventName,func)} /** @param eventName {String} */ clearEvent(eventName){this.events.set(eventName,_=>0)}}

class Game{
	static role_order = [0,3,2,1,3,2,1,3,2,1];
	/**
	 * @param name {String}
	 */
	constructor(name){
		/**@type {String[]}*/
		this.players = [];
		this.name = name;
		this.started = false;
	}
	addPlayer(name){
		this.players = this.players.filter(id=>PLAYER_LIST.get(id) != undefined);
		this.players.push(name)
	}
	removePlayer(name){
		this.players = this.players.filter(i=>i != name);
	}
	start(){
		//Initialize deck
		this.deck = new Card.CardList();

		//Randomly assign roles and set current player to player with KING role,
		//start game for all players
		let roles = shuffle(Game.role_order.slice(0, this.players.length)), p = 0;
		for(let player of this.players) PLAYER_LIST.get(player).start(roles[p++]);
		this.currentPlayer = 0;
		while(this.currPlayer.role) this.currentPlayer++;

		//Game loop (must call asynchronously because need to use await)

		/*async IIFE*/ (async _=>{
			let card;
			while(true){
				console.log(this.currPlayer.name + "'s turn");
				while(card = await this.currPlayer.requestCard(
					//[...Card.cards.keys()].join("|")
					"Kill"
				)){
					console.log(this.currPlayer.name,"played card",card);
				}
				this.currentPlayer++;
				this.currentPlayer %= this.players.length;
			}
		})();
	}
	get currPlayer(){
		return PLAYER_LIST.get(this.players[this.currentPlayer]);
	}
}

class Player{
	static ROLES = {KING:0,ADVISOR:1,TRAITOR:2,REBEL:3,NONE:4}
	/**
	 * @param playerName {Number}
	 * @param socket {SocketWrapper}
	 */
	constructor(playerName,socket){
		this.name = playerName;
		this.socket = socket;

		/**@type {Game} */
		this.game = undefined;
		this.preGameOperations();
	}

	preGameOperations(){
		const self = this;
		this.socket.on(
			'requestGameList',
			name=>this.socket.emit(
				"updateGameList",
				JSON.stringify(getAvailableGames())
			)
		);

		/**@param game {Game}*/
		function joinGame(name){
			var game = GAME_LIST.get(name);
			if(!game) return;
			if(game.players.includes(self.name)) return;

			console.log(`${self.name} joined a game: ${name}`)

			game.addPlayer(self.name)
			self.game = game;
			self.socket.emit("joinedGame")

			for(let player of game.players){
				PLAYER_LIST.get(player).socket.emit(
					"updatePlayerList",
					JSON.stringify(game.players)
				);
			}
			
			for(let player of PLAYER_LIST.values()){
				player.socket.emit(
					"updateGameList",
					JSON.stringify(getAvailableGames())
				)
			}
		}
		
		this.socket.on('requestCreateGame',name=>{
			if(name == "") name = "Generic Game";
			while(GAME_LIST.get(name)) name = name + "*";
			console.log(`${self.name} created a game: ${name}`)
			GAME_LIST.set(name,new Game(name));
			joinGame(name);
		})
		this.socket.on('requestJoinGame',joinGame)

		this.socket.on("requestStartGame",_=>{
			self.game.started = true;
			console.log(`Game ${self.game.name} was started by ${self.name}`)
			for(let player of PLAYER_LIST.values()){
				player.socket.emit(
					"updateGameList",
					JSON.stringify(getAvailableGames())
				)
			}
			self.game.start();
		})
	}

	clearPreGameSocketEvents(){
		this.socket.clearEvent("requestGameList")
		this.socket.clearEvent("requestCreateGame")
		this.socket.clearEvent("requestJoinGame")
		this.socket.clearEvent("requestStartGame")
	}

	start(role){
		this.socket.emit("startGame",role + "");
		this.role = role;
		this.clearPreGameSocketEvents();

		this.cards = [];
		this.hp = 5;
		for(let i = 0; i < 30; i++) this.cards.push(this.game.deck.nextCard());
		this.updateCards();
	}
	updateCards(){
		this.socket.emit("updateCards",JSON.stringify(this.cards.map(i=>Card.getCardData(i))))
	}

	toJSON(){
		return {name:this.name, hp:this.hp}
	}
	async requestCard(allowedCards){
		this.socket.emit("requestCard",allowedCards);
		return new Promise(resolve=>{this.socket.on("gaveCard",data=>{
			if(data == "") return resolve(null);
			let index = Number.parseInt(data);
			let cardName = this.cards[index];
			this.removeCard(index);
			resolve(cardName);
		})});
	}
	removeCard(card=null){
		if(card == null) card = Math.floor(Math.random() * this.cards.length);
		this.cards.splice(card,1);
		this.updateCards();
	}

	heal(amount=1){

	}
	damage(amount=1){

	}
	/** @param card {String} */
	addCard(card){
		this.cards.push(card);
	}
}



class Card{
	static CardList = class CardList{
		constructor(){
			this.deck = [];
			for(let [name,{frequency}] of Card.cards.entries()){
				for(;frequency;frequency--) this.deck.push(name);
			}
			shuffle(this.deck);
			this.discardPile = [];
		}
		nextCard(){
			if(this.deck.length == 0){	//Deck is empty
				if(this.discardPile.length){	//There are cards in the discard pile
					//Move all cards from discard pile to deck
					this.deck = this.discardPile;
					this.discardPile = [];
				}
				else{	//No cards in discard pile
					//'Reset' deck
					for(let [name,{frequency}] of Card.cards.entries()){
						for(;frequency;frequency--) this.deck.push(name);
					}
				}

				//shuffle deck
				shuffle(this.deck);
			}
			//Pop item off top of deck
			return this.deck.pop();
		}
		discardCard(card){
			this.discardPile.push(card);
		}
	}

	/**
	 * @typedef {(game:Game,origin:Player,target:Player)=>void} Effect
	 */

	/**
	 * @param cardName {String}
	 * @param description {String}
	 * @param effect {Effect}
	 */
	constructor(cardName,description,effect,frequency=1){
		this.cardName = cardName;
		this.description = description;
		this.effect = effect;
		this.frequency = frequency;
	}
	/** @param id {String} */
	static getCardData(cardName){
		let card = Card.cards.get(cardName);
		return JSON.stringify({
			cardName:card.cardName,
			description:card.description
		});
	}
	/**
	 * 
	 */
	static getRandCard(){
		/** @type {{value:String,frequency:Number}[]} */
		let entries = [...Card.cards.entries()].map(i=>({value:i[0],frequency:i[1].frequency}));
		
		let frequencySum = entries.reduce((a,b)=>a + b.frequency, 0);
		let randVal = Math.floor(Math.random() * frequencySum),threshold = 0;
		for(let i = 0; i < entries.length; i++){
			threshold += entries[i].frequency;
			if(threshold > randVal) return entries[i].value;
		}
		return null;

	}

	/**
	 * @param allPlayers {Player[]}
	 * @param origin {Player}
	 * @param target {Player}
	 */
	use(allPlayers,origin,target){this.effect(allPlayers,origin,target)}

	/**
	 * @param cardName {String}
	 * @param description {String}
	 * @param effect {Effect}
	 * @param frequency {Number}
	 */
	static addCard(cardName,description,effect,frequency){
		Card.cards.set(cardName, new Card(cardName,description,effect,frequency))
	}

	/** @type {Map<String,Card>} */
	static cards = new Map();
}

// {// Add all cards

// 	//基本牌
// 	Card.addCard("杀", "使对手受到1点伤害",
// 		async (game,origin,target)=>{
// 			if(!(await target.requestSpecificCard("闪"))) target.damage()
// 		}
// 	,30)
// 	Card.addCard("闪", "当受到【杀】的攻击时，可以使用一张【闪】来抵消【杀】的效果", ()=>{},15)
// 	Card.addCard("桃", "在出牌阶段，可以使用它来回复1点体力",
// 		(game,origin,target)=>{target.heal()}
// 	,8)
// 	//锦囊牌

// 	Card.addCard(
// 		"锦囊/决斗",
// 		"对首先不出【杀】的一方造成1点伤害，而另一方视为此伤害的来源。 　使用【决斗】有可能让自己受伤。",
// 		async (game,origin,target)=>{
// 			while(await game.requestSpecificCard(target,"杀")) [origin,target] = [target,origin];
// 			target.damage();
// 		}
// 	,3)
// 	Card.addCard("锦囊/无懈可击", "在目标锦囊生效前，抵消其对一名角色产生的效果。", ()=>{},4)
// 	Card.addCard(
// 		"锦囊/过河拆桥", 
// 		"出牌阶段，对除自己外任意一名角色使用。选择该角色的一张手牌（随机选一张）或装备，该角色弃置这张牌。",
// 		async (game,origin,target)=>{
// 			await target.requestRemoveCard()
// 		}
// 	,6)
// 	Card.addCard(
// 		"锦囊/顺手牵羊", 
// 		"出牌阶出牌阶段，对除自己以外，距离1以内的一名角色使用。选择并获得该角色的一张手牌（随机选一张）或装备。",
// 		async (game,origin,target)=>{
// 			await target.requestTransferCard(origin);
// 		}
// 	,5)
// }
{	//Add all cards
	//Basic cards
	Card.addCard("Kill", "Damage a player no further than 1 distance away for 1 health point",
		async (game,origin,target)=>{
			if(!(await target.requestSpecificCard("Dodge"))) target.damage()
		}
	,30)
	Card.addCard("Dodge", "When【Kill】is used against you, cancels the effect of【Kill】", ()=>{},15)
	Card.addCard("Eat", "Regenerate 1 health",
		(game,origin,target)=>{target.heal()}
	,8)
	//锦囊牌

	Card.addCard(
		"/Fight",
		"The first player unable to play【Kill】is damagd for 1 health point",
		async (game,origin,target)=>{
			while(await game.requestSpecificCard(target,"Kill")) [origin,target] = [target,origin];
			target.damage();
		}
	,3)
	Card.addCard("/Impeccable", "Cancel the effect of any Tactic card. Can be used on anybody", ()=>{},4)
	Card.addCard(
		"/Destroy", 
		"Cause an player no further than 1 distance away to lose a randomly selected card in their hand",
		async (game,origin,target)=>{
			await target.requestRemoveCard()
		}
	,6)
	Card.addCard(
		"/Steal", 
		"Cause an player no further than 1 distance away to give you a randomly selected card from their hand",
		async (game,origin,target)=>{
			await target.requestTransferCard(origin);
		}
	,5)
}


var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(s){
	let socket = new SocketWrapper(s);
	socket.on('setName',name=>{
		if(name == "") name = "Generic Player";
		while(PLAYER_LIST.get(name)) name = name + "*";
		socket.emit("updateName",name);
		console.log("Player " + name + " waiting to join a game");
		socket.clearEvent("setName");
		var player = new Player(name,socket);
		PLAYER_LIST.set(name,player);	
		socket.on('disconnect',function(){
			console.log(player.name + " disconnected")
			if(player.game){
				console.log("Removed " + player.name + " from game " + player.game.name);
				player.game.removePlayer(player.name);
				for(let player of PLAYER_LIST.values()){
					player.socket.emit("updateGameList",JSON.stringify(getAvailableGames()))
				}
				for(let p of player.game.players){
					PLAYER_LIST.get(p).socket.emit("updatePlayerList",JSON.stringify(player.game.players));
				}
			}
			PLAYER_LIST.delete(name);
		});
	})
});

setInterval(function(){
	let shouldUpdate = false;
	for(let[gameID,game]of GAME_LIST.entries()){
		if(!game.players.length){
			GAME_LIST.delete(gameID);
			shouldUpdate = true;
			console.log("No players in game " + gameID + ", deleting game");
		}
	}
	if(shouldUpdate){
		for(let player of PLAYER_LIST.values()){
			player.socket.emit(
				"updateGameList",
				JSON.stringify(getAvailableGames())
			);
		}
	}
},2000);