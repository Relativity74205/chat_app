import os

from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

socketio = SocketIO(app)
chats = {}
msg_id = 0

MAX_CHANNEL_LENGTH = 100


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return render_template("index.html")
    elif request.method == "POST":
        return redirect(url_for('chat'))


@app.route("/chat")
def chat():
    return render_template("chat.html")


@app.route("/channels", methods=["POST"])
def channels():
    return jsonify(list(chats.keys()))


@app.route("/msgs", methods=["POST"])
def msgs():
    channel = request.form.get("channel")

    return jsonify(chats[channel])


@socketio.on("del_msg")
def del_msg(data):
    ch = data["channel"]
    id = int(data["id"])

    chats[ch] = [entry for entry in chats[ch] if not entry['id'] == id]
    emit_dict = {'channel': ch,
                 'msgs': chats[ch]}

    emit("msgs_change", emit_dict, broadcast=True)


@socketio.on("submit_msg")
def submit_msg(data):
    global msg_id
    msg_id += 1

    ch = data["channel"]
    msg_dict = {
        'id': msg_id,
        'msg': data['new_msg'],
        'tstamp': data['tstamp'],
        'username': data['username']
    }

    if len(chats[ch]) == MAX_CHANNEL_LENGTH:
        chats[ch].pop(0)
    chats[ch].append(msg_dict)
    emit_dict = {'channel': ch,
                 'msgs': chats[ch]}

    emit("msgs_change", emit_dict, broadcast=True)


@socketio.on("submit_channel")
def chat(data):
    channel = data["new_channel"]
    if channel not in chats:
        chats[channel] = []
        new_channel = True
    else:
        new_channel = False

    if new_channel:
        chans = list(chats.keys())
    else:
        chans = -1
    emit_dict = {'channels': chans,
                 'channel_starter': data['channel_starter']}

    emit("new_channel", emit_dict, broadcast=True)
