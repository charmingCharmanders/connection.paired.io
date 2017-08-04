const models = require('../db/models/');


class PairingRoom {
  constructor(id, difficulty) {
    this.players = [];
    this.prompt = null;
    this.code = null;
    this.difficulty = difficulty;
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
        .where({ difficulty: this.difficulty})
        .fetchAll()
        .then(prompts => {
          console.log('prompts', prompts)
          const random = Math.floor(Math.random() * prompts.models.length);
          this.prompt = prompts.models[random].attributes;
          this.code = prompts.models[random].attributes.skeletonCode;
          resolve();
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
  }
  getDifficulty() {
    return this.difficulty;
  }

  getPrompt() {
    return this.prompt;
  }

  updateCode(code) {
    this.code = code;
  }
}

module.exports = PairingRoom;
