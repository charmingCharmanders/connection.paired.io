
class PairingRoom {
  constructor(id){
    this.players = [];
    this.prompt = {
      name: 'Add Two Numbers',
      description: 'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum bibendum velit id ullamcorper lobortis. Fusce egestas ac diam sed finibus.',
      category: 'Maths',
      hint: 'Hint. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum bibendum velit id ullamcorper lobortis. Fusce egestas ac diam sed finibus.',
      skeletonCode: 'const addTwoNumbers = function (a, b) { }',
      solutionCode: 'const addTwoNumbers = function (a, b) { return a + b; }',
      rating: null
    };
    this.code = this.prompt.skeletonCode;
    this.roomId = id;
  }

  addPlayer(playerId, playerRating) {
    this.players.push({
      playerId: playerId,
      playerRating: playerRating
    });
  }

  retrievePrompt() {
    //TODO David will implment?? :)
    //retrieve a random prompt from the database
    //needs to be an async function
  }

  removePlayer(playerId) {
    var index = this.players.findIndex(player => player.playerId === playerId);
    if (index >= 0) {
      this.players.splice(index, 1);
    }
  }

  playersInRoom() {
    return this.players.length;
  }

  isFull() {
    return this.players.length === 2;
  }

  getRoomId(){
    return this.roomId;
  }

  getPrompt(){
    return this.prompt;
  }

}

module.exports = PairingRoom;