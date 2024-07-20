(function () {
    const socket = io('http://localhost:5000');

    function generateID() {
        return `${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}`;
    }

    document.querySelector("#receiver-start-con-btn").addEventListener("click", function () {
        const senderID = document.querySelector("#join-id").value;
        if (senderID.length === 0) return;

        const joinID = generateID();
        socket.emit("receiver-join", { uid: joinID, sender_uid: senderID });
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
        console.log(`Receiver joined with RoomID: ${senderID}`);
    });
    socket.on("rec", () => {
        console.log("I can receive.");
    })
    let fileShare = {};

    socket.on("fs-meta", function(metadata) {
        console.log("fs-meta event received with metadata:", metadata);

        fileShare.metadata = metadata;
        fileShare.transmitted = 0;
        fileShare.buffer = [];
        let el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `<div class="progress">0%</div><div class="filename">${metadata.filename}</div>`;
        document.querySelector(".files-list").appendChild(el);
        fileShare.progress_node = el.querySelector(".progress");

        socket.emit("fs-start", { sender_uid: metadata.sender_uid, receiver_uid: metadata.receiver_uid });
        console.log(`Requested fs-start from sender: ${metadata.sender_uid}`);
    });

    socket.on("fs-share", function(data) {
        console.log("fs-share event received with buffer:", data.buffer);

        fileShare.buffer.push(data.buffer);
        fileShare.transmitted += data.buffer.byteLength;
        fileShare.progress_node.innerText = `${Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100)}%`;

        if (fileShare.transmitted === fileShare.metadata.total_buffer_size) {
            const blob = new Blob(fileShare.buffer);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileShare.metadata.filename;
            a.click();
            console.log(`File download completed: ${fileShare.metadata.filename}`);
        } else {
            socket.emit("fs-start", { sender_uid: fileShare.metadata.sender_uid, receiver_uid: fileShare.metadata.receiver_uid });
            console.log(`Requested next file chunk from sender: ${fileShare.metadata.sender_uid}`);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Connection Error:', error);
    });

    socket.on('error', (error) => {
        console.error('Socket Error:', error);
    });
})();
