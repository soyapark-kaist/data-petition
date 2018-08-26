/* post a new comment to DB. */
function postCommentCallback(inElement) {
    var params = getJsonFromUrl(true);
    /* UID for a new comments. */
    var playersRef = firebase.database().ref( "petition/" + params['petition'] + "/comments/" + (parent_id ? parent_id + "/comments/" : ""));
    
    var news_json = {
        "content": content,
        "time": new Date().toString(),
        "email": "test",
        "like": 0,
        "dislike": 0
    };

    playersRef.set(news_json);
}

var saveComment = function(data) {

	// Convert pings to human readable format
	$(data.pings).each(function(index, id) {
		var user = usersArray.filter(function(user){return user.id == id})[0];
		data.content = data.content.replace('@' + id, '@' + user.fullname);
	});

	// postCommentCallback(data);
	data.id = parseInt(new Date().getTime() / 1000);

	// If the user wishes to add the chart to comment, add to comments
	var wish_to_add_chart = document.querySelector('.input-chart-include').checked;
	if (wish_to_add_chart) {
		// Trigger button created by node
		var event = new CustomEvent("click", { "detail": "Example of an event" });
		var elem = $(".cb-button.export-button")[1];

		elem.dispatchEvent(event); 

		$(elem).trigger("click");

		data.file_mime_type = "image/png"
		data.file_url = $("#chart-export-output").text();
		debugger;
		$("#chart-export-output").text('');
	}

	// Push the new comment at the next index
	var params = getJsonFromUrl(true);
	var commentRef = firebase.database().ref("petition/" + params['petition'] + "/comments");
	commentRef.limitToLast(1).once('value', function(snapshot) {
		var key;
		if (snapshot.val()) 
		 	key= parseInt( Object.keys(snapshot.val())[0] );

		else key = -1;
		setDB("petition/" + params['petition'] + "/comments/" + (key +1), data);
	});
	
	return data;
}


// TODO attach vizualization
// {
//    "id": 4,
//    "parent": 3,
//    "created": "2015-01-04",
//    "modified": "2015-01-04",
//    "file_url": "data:image/png;base64,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",
//    "file_mime_type": "image/png",
//    "creator": 4,
//    "fullname": "Todd Brown",
//    "profile_picture_url": "https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png",
//    "created_by_admin": false,
//    "created_by_current_user": false,
//    "upvote_count": 0,
//    "user_has_upvoted": false
// }

var commentsArray = [], usersArray = [];

$(function() {
	var params = getJsonFromUrl(true);

	// When initially loaded, only load the lastest comment 
	var commentRef = firebase.database().ref("petition/" + params['petition'] + "/comments");
	commentRef.limitToLast(1).once('value', function(snapshot) {
	  if (snapshot.val())
		  commentsArray = [snapshot.val()[Object.keys(snapshot.val())[0]]];

	  reloadComments();
	});

	// TODO load more
	$("#btn_comment_load_more").click(function() {
		$(this).hide();
		var commentRef = firebase.database().ref("petition/" + params['petition'] + "/comments");
		commentRef.once('value', function(snapshot) {
			// var comment_arr = [];
			// for(var i = 0; i < snapshot.val().length; i++) {
			// 	comment_arr.push( snapshot.val()[i] );
			// 	comment_arr[i].id = snapshot.val()[i].id = "c" + i;
			// }
		  	commentsArray = snapshot.val();

		  	reloadComments();
		});
	});
	
});

function reloadComments() {
	$('#comments-container').comments({
		profilePictureURL: 'https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png',
		currentUserId: 1,
		roundProfilePictures: true,
		textareaRows: 1,
		enableAttachments: false,
		enableHashtags: true,
		enablePinging: true,
		getUsers: function(success, error) {
			setTimeout(function() {
				success(usersArray);
			}, 500);
		},
		getComments: function(success, error) {
			setTimeout(function() {
				console.log("get comments");
				success(commentsArray);
			}, 500);
		},
		postComment: function(data, success, error) {
			setTimeout(function() {
				success(saveComment(data));
			}, 500);
		},
		putComment: function(data, success, error) {
			setTimeout(function() {
				success(saveComment(data));
			}, 500);
		},
		deleteComment: function(data, success, error) {
			setTimeout(function() {
				success();
			}, 500);
		},
		upvoteComment: function(data, success, error) {
			setTimeout(function() {
				success(data);
			}, 500);
		},
		uploadAttachments: function(dataArray, success, error) {
			setTimeout(function() {
				success(dataArray);
			}, 500);
		},
	});
}