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

var commentsArray = [], usersArray = [];

$(function() {
	var saveComment = function(data) {

		// Convert pings to human readable format
		$(data.pings).each(function(index, id) {
			var user = usersArray.filter(function(user){return user.id == id})[0];
			data.content = data.content.replace('@' + id, '@' + user.fullname);
		});

		return data;
	}



	$('#comments-container').comments({
		profilePictureURL: 'https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png',
		currentUserId: 1,
		roundProfilePictures: true,
		textareaRows: 1,
		enableAttachments: true,
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
});