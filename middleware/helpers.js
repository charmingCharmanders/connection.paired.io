const translateRatingToDifficulty = function (rating) {
  if(rating < 100) {
    return 1;
  } else if(rating < 5000) {
    return 2;
  } else if(rating < 20000) {
    return 3;
  } else {
    return 4;
  }
};

module.exports = {
  translateRatingToDifficulty
};
