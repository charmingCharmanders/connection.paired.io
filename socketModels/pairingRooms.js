const models = require('../db/models/');

class PairingRoom {
  constructor(id) {
    this.players = [];
    this.prompt = null;
    this.code = null;
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

  getRoomId() {
    return this.roomId;
  }

  retrievePrompt() {
    return models.Prompt
      .count()
      .then(count => {
        const promptId = Math.floor(Math.random() * count);
        return models.Prompt
          .where({ id: promptId })
          .fetch();
      })
      .then(prompt => {
        this.prompt = prompt;
        this.code = prompt.skeletonCode;
      })
      .catch(err => {
        console.error(err);
      });
  }

  getPrompt() {
    return this.prompt;
  }

  updateCode(code) {
    this.code = code;
  }
}

module.exports = PairingRoom;
