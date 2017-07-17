'use strict';
const express = require('express');
const router = express.Router();
const TestsController = require('../controllers').Tests;

router.route('/')
  .get(TestsController.getAll)
  ;

// router.route('/:id')
//   .get(UsersController.getOne)
//   .put(UsersController.update)
//   ;

module.exports = router;