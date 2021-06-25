const template = Handlebars.compile("<option>{{ channel }}</option>");

document.addEventListener('DOMContentLoaded', () => {
    const msg_template = Handlebars.compile(document.querySelector('#msg_template').innerHTML);

    load_channels();

    document.querySelector('#channels').onchange = () => {
        document.querySelector('#msgs').innerHTML = '';
        const selected_channel = document.querySelector('#channels').value;
        load_msgs(selected_channel);
        localStorage.setItem('last_channel', selected_channel);
        check_channels();
        document.querySelector('#new_msg').focus();
    };

    // Connect to websocket
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    document.addEventListener('click', event => {
        const element = event.target;
        if (element.className === 'hide') {
            const id = element.id.substring(1);
            const channel = document.querySelector('#channels').value;
            socket.emit('del_msg', {'channel': channel, 'id': id});
        }
    });

    // When connected, configure buttons
    socket.on('connect', () => {

        document.querySelector('#sent_msg').onclick = () => {
            const msg = document.querySelector('#new_msg').value;
            const channel = document.querySelector('#channels').value;
            let time = new Date();
            let tstamp = time.toUTCString();
            let username = localStorage.getItem('user_name');
            socket.emit('submit_msg', {'channel': channel, 'new_msg': msg, 'tstamp': tstamp, 'username': username});
            document.querySelector('#new_msg').value = '';
        };

        document.querySelector('#start_channel').onclick = () => {
            const new_channel = document.querySelector('#channel_name').value;
            socket.emit('submit_channel',
                {'new_channel': new_channel, 'channel_starter': localStorage.getItem('user_name')});
            document.querySelector('#channel_name').value = '';
            document.querySelector('#msgs').innerHTML = '';
        };
    });

    socket.on('msgs_change', data => {
        if (data.channel === document.querySelector('#channels').value){
            document.querySelector('#msgs').innerHTML = '';
            data.msgs.forEach(add_msg);
            document.querySelector('#new_msg').focus();
        }
    });

    socket.on('new_channel', data => {
        if (data !== -1) {
            const old_channel = document.querySelector('#channels').value;
            document.querySelector('#channels').innerHTML = '';
            for (let i = 0; i < data.channels.length; i ++) {
                document.querySelector('#channels').innerHTML += template({'channel': data.channels[i]});
            }
            if (localStorage.getItem('user_name') === data.channel_starter){
                document.querySelector('#channels').value = data.channels[data.channels.length - 1];
                localStorage.setItem('last_channel', data.channels[data.channels.length - 1]);
                check_channels();
                document.querySelector('#new_msg').focus();
            } else{
                document.querySelector('#channels').value = old_channel;
            }
        }
    });

    function add_msg(msg_object) {
        document.querySelector('#msgs').innerHTML = msg_template({
            'id': 'm' + msg_object.id,
            'msg': msg_object.msg,
            'tstamp': msg_object.tstamp,
            'username': msg_object.username,
        }) + document.querySelector('#msgs').innerHTML;
    }

    function add_channel(channel) {
        document.querySelector('#channels').innerHTML += template({'channel': channel});
    }

    function load_channels() {
        const request = new XMLHttpRequest();
        request.open('POST', '/channels');
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            document.querySelector('#channels').innerHTML = '';
            data.forEach(add_channel);

            if (localStorage.getItem('last_channel') && data.length > 0) {
                const selected_channel = localStorage.getItem('last_channel');
                document.querySelector('#channels').value = selected_channel;
                load_msgs(selected_channel);
            }
            check_channels();
        };

        request.send();
    }

    function load_msgs(channel) {
        // Open new request to get all posts of a channel
        const request = new XMLHttpRequest();
        request.open('POST', '/msgs');
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            data.forEach(add_msg);
        };

        // Add start and end points to request data.
        const data = new FormData();
        data.append('channel', channel);

        // Send request.
        request.send(data);
    }

    document.querySelector("#new_msg").addEventListener("keyup", function(event) {
        event.preventDefault();
        if(event.keyCode === 13){
            document.querySelector("#sent_msg").click();
        }
    });

    document.querySelector("#channel_name").addEventListener("keyup", function(event) {
        event.preventDefault();
        if(event.keyCode === 13){
            document.querySelector("#start_channel").click();
        }
    });
});



function check_channels(){
    document.querySelector('#new_msg').disabled = (document.querySelector('#channels').value === '');
}




