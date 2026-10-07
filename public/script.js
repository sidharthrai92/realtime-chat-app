const socket = io();


// ELEMENTS

const joinScreen =
    document.getElementById("joinScreen");

const chatApp =
    document.getElementById("chatApp");

const joinForm =
    document.getElementById("joinForm");

const usernameInput =
    document.getElementById("username");

const roomInput =
    document.getElementById("room");

const joinError =
    document.getElementById("joinError");

const messages =
    document.getElementById("messages");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const usersList =
    document.getElementById("usersList");

const userCount =
    document.getElementById("userCount");

const roomName =
    document.getElementById("roomName");

const headerRoom =
    document.getElementById("headerRoom");

const typingBox =
    document.getElementById("typingBox");

const connectionStatus =
    document.getElementById("connectionStatus");

const emojiBtn =
    document.getElementById("emojiBtn");

const emojiPanel =
    document.getElementById("emojiPanel");

const themeBtn =
    document.getElementById("themeBtn");

const leaveBtn =
    document.getElementById("leaveBtn");

const mobileUsersBtn =
    document.getElementById("mobileUsersBtn");

const sidebar =
    document.querySelector(".sidebar");


let currentUser = null;

let typingTimer = null;


// JOIN

joinForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        const username =
            usernameInput.value.trim();

        const room =
            roomInput.value.trim() ||
            "general";

        if (!username) {

            joinError.textContent =
                "Please enter your name.";

            return;
        }

        socket.emit(
            "join-room",
            {
                username,
                room
            }
        );
    }
);


// JOIN SUCCESS

socket.on(
    "joined",
    ({ user, users }) => {

        currentUser = user;

        joinScreen.classList.add(
            "hidden"
        );

        chatApp.classList.remove(
            "hidden"
        );

        roomName.textContent =
            `# ${user.room}`;

        headerRoom.textContent =
            `# ${user.room}`;

        renderUsers(users);

        messageInput.focus();

        addSystemMessage(
            `You joined #${user.room}`
        );
    }
);


// JOIN ERROR

socket.on(
    "join-error",
    (message) => {

        joinError.textContent =
            message;
    }
);


// NEW MESSAGE

socket.on(
    "new-message",
    (message) => {

        addMessage(message);
    }
);


// SYSTEM MESSAGE

socket.on(
    "system-message",
    (message) => {

        addSystemMessage(
            message.text
        );
    }
);


// USERS

socket.on(
    "room-users",
    (users) => {

        renderUsers(users);
    }
);


// TYPING

socket.on(
    "typing",
    ({ username, isTyping }) => {

        if (isTyping) {

            typingBox.textContent =
                `${username} is typing...`;

        } else {

            typingBox.textContent =
                "";
        }
    }
);


// CONNECTED

socket.on(
    "connect",
    () => {

        connectionStatus.textContent =
            "● Connected";

        connectionStatus.style.color =
            "#20bf6b";
    }
);


// DISCONNECTED

socket.on(
    "disconnect",
    () => {

        connectionStatus.textContent =
            "● Disconnected";

        connectionStatus.style.color =
            "#e74c3c";
    }
);


// SEND MESSAGE

messageForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        const text =
            messageInput.value.trim();

        if (!text || !currentUser) {
            return;
        }

        socket.emit(
            "send-message",
            { text }
        );

        messageInput.value = "";

        socket.emit(
            "typing",
            false
        );

        messageInput.focus();
    }
);


// TYPING

messageInput.addEventListener(
    "input",
    () => {

        socket.emit(
            "typing",
            messageInput.value.trim().length > 0
        );

        clearTimeout(typingTimer);

        typingTimer = setTimeout(
            () => {

                socket.emit(
                    "typing",
                    false
                );

            },
            1000
        );
    }
);


// EMOJI BUTTON

emojiBtn.addEventListener(
    "click",
    () => {

        emojiPanel.classList.toggle(
            "hidden"
        );
    }
);


// EMOJI CLICK

emojiPanel
    .querySelectorAll("button")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    messageInput.value +=
                        button.textContent;

                    messageInput.focus();

                    emojiPanel.classList.add(
                        "hidden"
                    );
                }
            );

        }
    );


// CLOSE EMOJI

document.addEventListener(
    "click",
    (event) => {

        if (
            !emojiPanel.contains(event.target) &&
            event.target !== emojiBtn
        ) {

            emojiPanel.classList.add(
                "hidden"
            );
        }
    }
);


// DARK MODE

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        const dark =
            document.body.classList.contains(
                "dark"
            );

        themeBtn.textContent =
            dark
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";

        localStorage.setItem(
            "chatTheme",
            dark
                ? "dark"
                : "light"
        );
    }
);


// LOAD THEME

if (
    localStorage.getItem(
        "chatTheme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );

    themeBtn.textContent =
        "☀️ Light Mode";
}


// LEAVE

leaveBtn.addEventListener(
    "click",
    () => {

        location.reload();
    }
);


// MOBILE USERS

mobileUsersBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "mobile-open"
        );
    }
);


// RENDER USERS

function renderUsers(users) {

    userCount.textContent =
        users.length;

    usersList.innerHTML = "";

    users.forEach(
        (user) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "user";


            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "avatar";

            avatar.textContent =
                user.username
                    .charAt(0)
                    .toUpperCase();


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "user-name";

            name.textContent =
                user.username;


            if (
                currentUser &&
                user.id === currentUser.id
            ) {

                const you =
                    document.createElement(
                        "span"
                    );

                you.className =
                    "you";

                you.textContent =
                    " (You)";

                name.appendChild(
                    you
                );
            }


            div.appendChild(
                avatar
            );

            div.appendChild(
                name
            );

            usersList.appendChild(
                div
            );
        }
    );
}


// ADD MESSAGE

function addMessage(message) {

    const isMine =
        currentUser &&
        message.senderId ===
        currentUser.id;


    const row =
        document.createElement(
            "div"
        );

    row.className =
        `message-row ${
            isMine ? "mine" : ""
        }`;


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "avatar";

    avatar.textContent =
        message.username
            .charAt(0)
            .toUpperCase();


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const name =
        document.createElement(
            "div"
        );

    name.className =
        "message-name";

    name.textContent =
        isMine
            ? "You"
            : message.username;


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message.text;


    const time =
        document.createElement(
            "div"
        );

    time.className =
        "message-time";

    time.textContent =
        formatTime(
            message.time
        );


    content.appendChild(
        name
    );

    content.appendChild(
        bubble
    );

    content.appendChild(
        time
    );


    row.appendChild(
        avatar
    );

    row.appendChild(
        content
    );


    messages.appendChild(
        row
    );

    scrollToBottom();
}


// SYSTEM MESSAGE

function addSystemMessage(text) {

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "system-message";

    div.textContent =
        `• ${text} •`;

    messages.appendChild(
        div
    );

    scrollToBottom();
}


// TIME

function formatTime(dateString) {

    return new Date(
        dateString
    ).toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// SCROLL

function scrollToBottom() {

    messages.scrollTop =
        messages.scrollHeight;
}