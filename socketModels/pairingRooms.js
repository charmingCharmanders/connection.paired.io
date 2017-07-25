const models = require('../db/models/');

class PairingRoom {
  constructor(id) {
    this.players = [];
    this.prompt = null;
    this.code = null;
    this.roomId = id;
  }

  addPlayer(playerId, profileRating, profileId) {
    this.players.push({
      playerId: playerId,
      profileRating: profileRating,
      profileId: profileId
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

  getPlayers() {
    return this.players;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  isFull() {
    return this.players.length === 2;
  }

  getRoomId() {
    return this.roomId;
  }

  retrievePrompt() {
    return new Promise((resolve, reject) => {
      models.Prompt
        .count()
        .then(count => {
          const promptId = Math.floor(Math.random() * count);
          return models.Prompt
            .where({ id: promptId })
            .fetch();
        })
        .then(prompt => {
          this.prompt = prompt.attributes;
          this.code = prompt.attributes.skeletonCode;
          resolve();
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
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
