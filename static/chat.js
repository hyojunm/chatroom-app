const server = window.location.protocol + "//" + document.domain + ":" + window.location.port;
const socket = io.connect(server, { transports: ["websocket"] });

socket.on("message", getMessage);
socket.on("notification", getNotification);
socket.on("users", updateUsers);

$("#send-btn").click(event => { sendMessage(event, "message-input", "public"); });
$("#private-send-btn").click(event => { sendMessage(event, "private-message-input", "private"); });

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
			<div class="col-3 text-break">
				<strong>${message.user}</strong><br>
				<small>${formattedDate}</small>
			</div>
			<p class="col-9 text-break">${message.message}</p>
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
		<div class="alert alert-dark my-3 text-center text-break">
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
		const userElement = $(`.user:contains(${String.raw`${user}`})`);
		const username = userElement.filter(index => {
			return $(userElement[index]).text().replace("(you)", "").trim() == user;
		});

		if (username.length <= 0) {
			const newUser = `
				<a href="#" class="dropdown-item disabled user text-truncate" title="Start a private chat with ${user}">
		        	<strong>${user}</strong>
		        </a>
			`;

			$("#users-list").append(newUser);
			$(`.user:contains(${String.raw`${user}`})`).click(inviteUser);
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