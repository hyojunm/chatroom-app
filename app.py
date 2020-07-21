import os, time
from flask import Flask, render_template, session, redirect, url_for, request, flash
from flask_socketio import SocketIO, send, emit

app = Flask(__name__)
socketio = SocketIO(app)

app.secret_key = os.environ.get("SECRET_KEY") or "secret key"

users = {}

@app.route("/")
def home():
	user = session.get("user")

	if not user:
		return redirect(url_for("join"))

	return render_template("chat.html", title="Home", user=user)

@app.route("/join", methods=["GET", "POST"])
def join():
	if request.method == "POST":
		username = request.form["username"]

		if not username:
			flash("Username is required to join.")
		elif username in users:
			flash("Username is already taken.")
		else:
			session["user"] = username
			return redirect(url_for("home"))

	return render_template("join.html", title="Join", user=False)

@app.route("/leave")
def leave():
	if session.get("user"):
		flash("You left the conversation. See you later!")
		session.pop("user")

	return redirect(url_for("join"))

@socketio.on("connection")
def handle_connection(message):
	user = session.get("user")

	message_info = {
		"user": user,
		"message": message["message"],
		"room": message["room"]
	}

	if message["room"] == "private":
		user = users[user]
		private_chat = users[session.get("private_chat")] if session.get("private_chat") else users[message["user"]]

		if message["message"] == "accepted the invite":
			session["private_chat"] = message["user"]
			emit("notification", message_info, room=user)
		elif message["message"] == "left":
			session.pop("private_chat")
		
		emit("notification", message_info, room=private_chat)
	else:
		if message["message"] == "joined":
			users[user] = request.sid
		else:
			users.pop(user)

		users_info = {
			"total": len(users),
			"usernames": users
		}

		emit("notification", message_info, broadcast=True)
		emit("users", users_info, broadcast=True)

@socketio.on("message")
def receive_message(message):
	message_info = {
		"user": session.get("user"),
		"date": time.time() * 1000,
		"message": message["message"],
		"room": message["room"]
	}

	if message["message"]:
		if message["room"] == "private":
			user = users[session.get("user")]
			private_chat = users[session.get("private_chat")]
			send(message_info, room=user)
			send(message_info, room=private_chat)
		else:
			send(message_info, broadcast=True)

@socketio.on("invite")
def receive_invite(user):
	host_user = session.get("user")
	invited_user = users[user["user"]] if user["user"] in users else None

	user_info = {
		"user": host_user
	}

	if invited_user and host_user != user["user"]:
		session["private_chat"] = user["user"]
		emit("invitation", user_info, room=invited_user)

if __name__ == "__main__":
	socketio.run(app)