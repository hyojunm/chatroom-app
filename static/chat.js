var socket = io.connect("https://" + document.domain + ":" + window.location.port + "/", { transports: ["websocket"] });

socket.on("connect", join);
socket.on("message", getMessage);
socket.on("notification", getNotification);
socket.on("users", updateUsers);

$("#send-btn").click(event => { sendMessage(event, "message-input", "public"); });
$("#private-send-btn").click(event => { sendMessage(event, "private-message-input", "private"); });
$("#leave-btn").click(leave);

$(window).on("unload", leave);

function join() {
	const message = {
		"message": "joined",
		"room": "public"
	};

	socket.emit("connection", message);
}

function leave() {
	const message = {
		"message": "left",
		"room": "public"
	};

	socket.emit("connection", message);
	socket.disconnect();
}

function sendMessage(event, messageInput, room) {
	event.preventDefault();

	const message = $("#" + messageInput).val();
	socket.send({ "message": message, "room": room });

	$("#" + messageInput).val("");
}

function getMessage(message) {
	const formattedDate = formatDate(message.date);
	const newMessage = `
		<div class="message row my-3">
			<div class="col-3">
				<strong>${message.user}</strong><br>
				<small>${formattedDate}</small>
			</div>
			<p class="col-9">${message.message}</p>
		</div>
	`;

	if (message.room == "private") {
		$("#private-history").append(newMessage);
	} else {
		$("#history").append(newMessage);
	}

	scrollHistory();
}

function getNotification(message) {
	const newMessage = `
		<div class="alert alert-dark my-3 text-center">
			<strong>${message.user}</strong> ${message.message}.
		</div>
	`;

	if (message.room == "private") {
		$("#private-history").append(newMessage);
	} else {
		$("#history").append(newMessage);
	}

	scrollHistory();
}

function updateUsers(users) {
	$("#total-users").text(users.total);

	for (user in users.usernames) {
		const username = $(".user:contains('" + user + "')");

		if (username.length <= 0) {
			const newUser = `
				<a href="#" class="dropdown-item disabled user" title="Start a private chat with ${user}">
		        	<strong>${user}</strong>
		        </a>
			`;

			$("#users-list").append(newUser);
			$(".user:contains('" + user + "')").click(inviteUser);
		}
	}

	for (user of $(".user")) {
		const username = $(user).text().replace("(you)", "").trim();

		if (!users.usernames.hasOwnProperty(username)) {
			$(user).remove();
		}
	}
}

function scrollHistory() {
	const mainWidth = $("body")[0].scrollHeight;
	const privateWidth = $("#private-history")[0].scrollHeight;

	$(window).scrollTop(mainWidth);
	$("#private-history").scrollTop(privateWidth);
}

function formatDate(milliseconds) {
	const date = new Date(milliseconds);

	let timePeriod = "am";
	let hour = date.getHours();
	let minute = date.getMinutes();

	if (hour >= 12) {
		timePeriod = "pm";
		if (hour !== 12) {
			hour -= 12;
		}
	}

	if (String(minute).length <= 1) {
		minute = "0" + minute;
	}

	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hour}:${minute}${timePeriod}`;
}
