
class PairingRoom {
  constructor(id){
    this.players = [];
    this.prompt = {
      name: 'problem1',
      description: 'here is the problem',
      category: 'recursion',
      hints: 'hint 1 hint 2',
      skeletonCode: 'code',
      solutionCode: 'code'
    };
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