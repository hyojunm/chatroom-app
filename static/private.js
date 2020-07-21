socket.on("invitation", receiveInvitation);
$("#private-chat").on("hidden.bs.modal", leavePrivateChat);

function receiveInvitation(user) {
	const confirmMessage = confirm(user.user + " invited you to a private chat.");
	let message = {
		"message": "",
		"room": "private",
		"user": user.user
	};

	if (confirmMessage) {
		leavePrivateChat();

		message.message = "accepted the invite";
		socket.emit("connection", message);

		$("#private-chat").modal("show");
		$("#private-chat-user").text(user.user);
		$("#private-history").empty();
	} else {
		message.message = "declined the invite";
		socket.emit("connection", message);
	}
}

function inviteUser(event) {
	const selectedUser = $(event.currentTarget).text().replace(" (you)", "").trim();
	socket.emit("invite", { "user": selectedUser });

	$("#private-chat").modal("show");
	$("#private-chat-user").text(selectedUser);
	$("#private-history").empty();
}

function leavePrivateChat() {
	const message = {
		"message": "left",
		"room": "private"
	};

	socket.emit("connection", message);
}