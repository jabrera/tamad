var App = {
	ready: function() {
		this.Firebase.start();
		$(document).on("keydown", "#txtAdd", function(e) {
			if(e.which == 13) {
				var val = $(this).val();
				App.Firebase.ref("users/"+App.Data.uid+"/lists").push({
					"message": val,
					"checked": false
				}, function() {
					App.updateList();
				})
				$(this).val("");
			}
		});
		$(document).on("change", "#list input", function() {
			var cardID = $(this).parents(".card").attr("data-card-id");
			var checked = $(this).is(":checked");
			if(checkbox)
				$(this).parents(".card").addClass("checked");
			else
				$(this).parents(".card").removeClass("checked");
			App.Firebase.ref("users/"+App.Data.uid+"/lists/"+cardID).update({
				"checked": checked
			}, function() {
				App.updateList();
			})
		})
	},
	checkAll: function() {
		$("#list").find("input").attr("checked", "");
		$("#list .card").each(function() {
			var id = $(this).attr("data-card-id");
			App.Firebase.ref("users/"+App.Data.uid+"/lists/"+id).update({
				"checked": true
			});
		});
		App.updateList();
	},
	delete: function() {
		var delay = 0;
		$("#list .card").each(function() {
			var el = $(this);
			if($(this).find("input").is(":checked")) {
				var id = $(this).attr("data-card-id");
				App.Firebase.ref("users/"+App.Data.uid+"/lists/"+id).remove();
				setTimeout(function() {
					el.animate({
						"left": el.outerWidth()+"px",
						"opacity": "0"
					}, 500, function() {
						setTimeout(function() {
							el.css({
								"overflow": "hidden",
								"margin-top": "0px"
							}).animate({
								"max-height": "0px"
							}, 1000, function() {
								el.remove();
								App.updateList();
							});
						}, (500*2)+delay)
					});
				}, delay)
				delay += 150;
			}
		});
	},
	updateList: function() {
		App.Firebase.ref("users/"+App.Data.uid+"/lists").once("value", function(data) {
			$("#list").html("");
			var total = 0, done = 0;
			for(var i in data.val()) {
				if(data.val()[i].checked)
					done++;
				total++;
				$("#list").prepend('<div class="card'+((data.val()[i].checked) ? " checked" : "")+'" data-card-id="'+i+'">' +
			'<div class="wrapper">' +
				'<div class="table middle">' +
					'<div class="row">' +
						'<div class="cell fit">' +
							'<label><input type="checkbox"'+((data.val()[i].checked) ? " checked" : "")+'><i></i></label>' +
						'</div>' +
						'<div class="cell">'+data.val()[i].message+'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>');
			}
			$("#doneOverTotal").html(done+"/"+total);
		});
	},
	Data: {},
	Firebase: {
		config: {
			apiKey: "AIzaSyB0AfuqkilhmvWWmu-9OdcES41G-ZXKMmA",
			authDomain: "tamad-b4d8a.firebaseapp.com",
			databaseURL: "https://tamad-b4d8a.firebaseio.com",
			storageBucket: "tamad-b4d8a.appspot.com",
			messagingSenderId: "262487031339"
		},
		start: function() {
			firebase.initializeApp(this.config);
			this.auth = firebase.auth();
			this.database = firebase.database();
			this.storage = firebase.storage();
			this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
		},
		ref: function(dir) {
			return this.database.ref(dir);
		},
		onAuthStateChanged: function(user) {
			if(user) {
				var getdata = ["uid", "displayName", "email", "photoURL"];
				for(var key in user) {
					if(getdata.indexOf(key) >= 0)
						App.Data[key] = user[key];
				}
				App.load("loggedin");
				App.Firebase.ref("users/"+user.uid).once("value", function(data) {
				if(!data.child("displayName").exists())
					App.Firebase.ref("users/"+user.uid).set({
						displayName: user.displayName,
						photoURL: user.photoURL,
						email: user.email,
						list: {}
					});	
				App.Firebase.ref("users/"+user.uid).update({
					photoURL: user.photoURL
				});
			});
			} else {
				App.Data = {};
				App.load("login");
			}
		}
	},
	logout: function() {
		App.Firebase.auth.signOut();
	},
	login: function() {
		var provider = new firebase.auth.GoogleAuthProvider();
		App.Firebase.auth.signInWithPopup(provider);
	},
	load: function(page) {
		if($("body > .content > .loading").length == 0)
			$("body > .content").html('<div class="loading"><svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="6" stroke-miterlimit="10"/></svg><p>Tinatamad pa magload.</p></div>');
		$.ajax({
			"type": "post",
			"data": {"load": true},
			"url": "views/"+page+".html",
			"cache": true,
			"success": function(html) {
				html = substituteVariables(html);
				$("body > .content").html(html);
			}
		})
		function substituteVariables(html) {
			for(var key in App.Data) {
				html = html.replace(new RegExp("{{"+key+"}}", "g"), App.Data[key]);
			}
			return html;
		}
	}
};
App.ready();