// Sequoia Copyright (C) 2020  Zan Naeem, Abdulrahman Alfayad
// This program comes with ABSOLUTELY NO WARRANTY; for details see LICENSE.
// This is free software, and you are welcome to redistribute it
// under certain conditions; see LICENSE for details.


//server.js
'use strict';

//Loading Dependencies =============================================
require('dotenv').config()
var express      = require('express');
var app = express();
var passport     = require('passport')
var session      = require('express-session')
var flash        = require('express-flash')
var path         = require('path');
var helmet       = require('helmet');
var mongoose     = require('mongoose');
var morgan       = require('morgan');
var bodyParser   = require('body-parser');
var hbs          = require('express-handlebars');


//loading local files ===============================================
var userRoutes     = require('./api/routes/user');
var calculusRoutes = require('./api/routes/calculus');
var ruleRoutes     = require('./api/routes/rule');
var symbolsRoutes  = require('./api/routes/symbols');
var database       = require('./config/db');
var sml_command    = require('./sml/smlCommands');
var initPassport   = require('./passport-config');
var userModel      = require('./api/models/user');
var calculusModel  = require('./api/models/calculus');
initPassport(passport, userModel)


// view engine setup
app.engine('hbs', hbs({defaultLayout : 'layout', extname : '.hbs'}))
app.set('view engine', 'hbs');


// public folder path setup
app.use('/sequoia/static', express.static(path.join(__dirname, '/public')));
app.use('/sequoia/bower', express.static(path.join(__dirname, '/bower_components')));


//Configurations =====================================================
app.use(helmet()); // configuring headers to be secure
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: false})); // get information from html forms
app.use(flash())
app.use(session({
    secret: "process.env.SESSION_SECRET",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())


//connecting to mongo database 
mongoose.connect(database.local, {useNewUrlParser: true, useUnifiedTopology: true});


//Api Routers ===========================================================
app.use('/sequoia/api', userRoutes);
app.use('/sequoia/api', calculusRoutes);
app.use('/sequoia/api', ruleRoutes);
app.use('/sequoia/api', symbolsRoutes);


//Page Routes ===========================================================
app.get('/sequoia', function (req, res) {
	if (req.isAuthenticated()) {
		return res.render('login/landing', {'layout' : 'landing_in', 'page' : "in"});
	}
	return res.render('login/landing', {'layout' : 'landing_out', 'page' : "out"});
});

app.get('/sequoia/home', checkAuthenticated, function (req, res) {
	return res.render('main/index', {'title' : 'Sequoia','layout' : 'main', 'user_id' : req.user._id, 'username' : req.user.username});
});

app.get('/sequoia/login', function (req, res) {
	if (req.isAuthenticated()) {
		return res.redirect('/sequoia/home')
	}
	if (req.flash('error').length > 0) {
		return res.render('login/index', {'title' : 'Sequoia - login','layout' : 'login', 'page' : "fail"});
	}
	return res.render('login/index', {'title' : 'Sequoia - login','layout' : 'login', 'page' : "normal"});
});

app.post('/sequoia/login', checkNotAuthenticated, passport.authenticate('local', {
	session: true,
	successRedirect: '/sequoia/home',
	failureRedirect : '/sequoia/login',
	failureFlash : true}
));

app.get('/sequoia/logout', checkAuthenticated, function(req, res) {
	req.logout()
    res.redirect('/sequoia/login')
});

app.get('/sequoia/register', checkNotAuthenticated, function (req, res) {
	return res.render('login/register', {'title' : 'Sequoia - register','layout' : 'login'});
});

app.get('/sequoia/calculus/:calc_id', checkAuthenticated, function (req, res) {
	return res.render('calculus/index', {'title' : 'Sequoia - calculus', 'layout' : 'calculus', 'calc_id' : req.params.calc_id});
});

app.get('/sequoia/calculus/:calc_id/add-rule', checkAuthenticated, function (req, res) {
	return res.render('rule/index', {'title' : 'Sequoia - add rule', 'layout' : 'rule', 'calc_id' : req.params.calc_id,
						'page' : 'Add'});
});

app.get('/sequoia/calculus/:calc_id/edit-rule/:rule_id', checkAuthenticated, function (req, res) {
	return res.render('rule/index', {'title' : 'Sequoia - edit rule', 'layout' : 'rule', 'calc_id' : req.params.calc_id, 
					'rule_id' : req.params.rule_id, 'page' : 'Update'});
});

app.get('/sequoia/calculus/:calc_id/apply', checkAuthenticated, function (req, res) {
	return res.render('apply/index', {'title' : 'Sequoia - apply', 'layout' : 'apply', 'calc_id' : req.params.calc_id});
});

app.post('/sequoia/apply', checkAuthenticated, function (req, res) {
	var result = sml_command.applyRule(req.body.rule, req.body.tree, req.body.node_id, req.body.index, req.body.subs, res);
});

app.get('/sequoia/calculus/:calc_id/properties', checkAuthenticated, function (req, res) {
	return res.render('properties/index', {'title' : 'Sequoia - properties', 'layout' : 'properties', 'calc_id' : req.params.calc_id});
});

app.get('/sequoia/calculus/:calc_id/properties/permutability', checkAuthenticated, function (req, res) {
	return res.render('properties/permutability', {'title' : 'Sequoia - properties', 'layout' : 'permutability', 'calc_id' : req.params.calc_id});
});

app.post('/sequoia/permute', checkAuthenticated, function (req, res) {
	var result = sml_command.permuteRules(req.body.rule1, req.body.rule2, req.body.init_rules, req.body.wL, req.body.wR, res);
});

app.get('/sequoia/calculus/:calc_id/properties/init_coherence', checkAuthenticated, function (req, res) {
	return res.render('properties/initcoherence', {'title' : 'Sequoia - properties', 'layout' : 'initcoherence', 'calc_id' : req.params.calc_id});
});

app.post('/sequoia/initRules', checkAuthenticated, function (req, res) {
	var result = sml_command.initRules(req.body.first, req.body.second, req.body.third, res);
});

app.get('/sequoia/calculus/:calc_id/properties/weak_admissability', checkAuthenticated, function (req, res) {
	return res.render('properties/weakadmiss', {'title' : 'Sequoia - properties', 'layout' : 'weakadmiss', 'calc_id' : req.params.calc_id});
});

app.post('/sequoia/weakenSides', checkAuthenticated, function (req, res) {
	var result = sml_command.weakenSides(req.body.rules, res);
});

app.get('/sequoia/calculus/:calc_id/properties/cut_admissability', checkAuthenticated, function (req, res) {
	return res.render('temporary/index', {'title' : 'Sequoia', 'layout' : 'temporary'});
});

function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
		if (req.params.calc_id != null) {
			calculusModel.find({_id : req.params.calc_id, user : req.user._id}, function (err, calculus) {
				if (err || calculus.length == 0) {
					return res.status(403).json();
				} else {
					return next()
				}
			})
		} else {
			return next()
		}
    } else {
		res.redirect('/sequoia/login')
	}
}

function checkNotAuthenticated (req, res, next) {
	if (!req.isAuthenticated()) {
		return next()
	}
	res.redirect('/sequoia/login')
}


//intiating server ==================================================
app.listen(8080);
