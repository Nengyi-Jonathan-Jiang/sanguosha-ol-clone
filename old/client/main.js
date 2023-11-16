async function main(socket,NAME,ROLE){

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


/**@type {HTMLDivElement}*/
const mainDiv = document.getElementById("content");
/**@type {HTMLDivElement}*/
const nameDisplaySpan = document.getElementById("nameDisplay");
/**@type {HTMLDivElement}*/
const infoSpan = document.getElementById("info");

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
			d.innerHTML = `<cardName>${cardName}</cardName><span class="line"></span><span class="card-description">${description}</span>`;
			this.div = d;
			
		}
	}
	/**@param div {HTMLDivElement} */
	constructor(div){
		this.div = div;
		/** @type {CardList.Card[]} */
		this.cards = []
		
		let self = this;
		this.resolve = _=>0;
		onDrag(this.div,_=>(el=>[...el.classList].includes("player")),(card,player)=>self.resolve(card,player));
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
			
			self.resolve = /**
			 * @param card {HTMLDivElement}
			 * @param player {HTMLDivElement}
			 */(card,player)=>{
				if(!card || !player) return;
				console.log(card,player)
				let n = Array.prototype.indexOf.call(card.parentElement.children, card);
				self.resolve = _=>0;
				resolve(n,[...player.children][0].innerText);
			}
			window.onkeypress = ({key})=>{
				console.log("you pressed a key: " + key)
				if(key=="n"){
					this.clearCardClickEvent();
					this.clearDisabled();
					console.log("next player's turn");
					resolve("");
					self.resolve = _=>0;
				}
			}

			for(let card of this.cards){
				if(allowedCards.includes(card.cardName)){
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

let cardList = new CardList(document.getElementById("Cards"));

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

initGame(callback=main);