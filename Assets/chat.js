var chat = {
    chatContainer: null,
    chatInputContainer: null,
    input: null,
    messages: null,
    isChatOpen: false,
    socket: null,
    init: (socket) => {
        chat.socket = socket;

        chat.socket.on('chat-message', chat.receiveMessage);

        chat.input = $("#chat-messageinput")[0];
        chat.chatContainer = document.getElementById('chat');
        chat.chatInputContainer = document.getElementById('chat-content');
        chat.input = document.getElementById('chat-messageinput');
        chat.messages = document.getElementById('chat-messages');

        document.getElementById('chat-button').addEventListener("click", chat.toggleChat);
        document.getElementById('chat-close-button').addEventListener("click", chat.toggleChat);

        document.getElementById('chat-sendmessage').addEventListener("click", chat.sendMessage);

        chat.chatInputContainer.style.display = "none";


        chat.input.addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                chat.sendMessage();
            }
        });
    },
    toggleChat: () => {
        chat.isChatOpen = !chat.isChatOpen;
        if (chat.isChatOpen) {
            chat.chatContainer.style.height = "100%";
            chat.chatInputContainer.style.display = "block";
        }
        else {
            chat.chatContainer.style.height = "12px";
            chat.chatInputContainer.style.display = "none";
        }
    },
    sendMessage: () => {
        if (chat.input.value != '') {
            chat.socket.emit('chat-message', chat.input.value);
            chat.input.value = '';
            chat.input.focus();
        }
    },
    receiveMessage: (envelope) => {
        if (!chat.isChatOpen) {
            $("#chat-button").fadeOut();
            setTimeout($("#chat-button").fadeIn(), 1000);
            setTimeout($("#chat-button").fadeOut(), 2000);
            setTimeout($("#chat-button").fadeIn(), 3000);
        }
        let p = document.createElement("p");
        p.textContent = envelope.pseudo + ': ' + envelope.message;
        chat.messages.append(p);
    }
};