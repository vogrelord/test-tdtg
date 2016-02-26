var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {	
  res.render('index', { title: 'Express' });
});

router.get('/json', function(req,res){
	request.get('http://www.reddit.com/r/javascript/.json', (err, resp)=>{
		res.send(JSON.parse(resp.body));
	});
})

module.exports = router;
