
class PairingRoom {
  constructor(id){
    this.players = [];
    this.roomId = id;
  }

  addPlayer(playerId, playerRating) {
    this.players.push({
      playerId: playerId,
      playerRating: playerRating
    });
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

}

module.exports = PairingRoom;