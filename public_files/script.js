(function () {
    let receiverID;
    const socket = io('http://localhost:5000');

    function generateID() {
        return `${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}`;
    }

    document.querySelector("#sender-start-con-btn").addEventListener("click", function () {
        let joinID = generateID();
        document.querySelector("#join-id").innerHTML = `<b>Room ID</b><span>${joinID}</span>`;
        socket.emit("sender-join", { uid: joinID });
    });

    socket.on("init", function(uid) {
        receiverID = uid;
        console.log(`Received init event with UID: ${uid}`);
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    document.querySelector("#file-input").addEventListener("change", function(e) {
        let file = e.target.files[0];
        if (!file) return;

        let reader = new FileReader();
        reader.onload = function() {
            let buffer = new Uint8Array(reader.result);
            let el = document.createElement("div");
            el.classList.add("item");
            el.innerHTML = `<div class="progress">0%</div><div class="filename">${file.name}</div>`;
            document.querySelector(".files-list").appendChild(el);
            shareFile({
                filename: file.name,
                total_buffer_size: buffer.length,
                buffer_size: 1024,
                sender_uid: socket.id,
                receiver_uid: receiverID
            }, buffer, el.querySelector(".progress"));
        }
        reader.readAsArrayBuffer(file);
    });

    function shareFile(metadata, buffer, progress_node) {
        socket.emit("file-meta", { metadata });
        socket.on("fs-share-sender", function() {
            let chunk = buffer.slice(0, metadata.buffer_size);
            buffer = buffer.slice(metadata.buffer_size, buffer.length);
            progress_node.innerText = `${Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100)}%`;
            if (chunk.length !== 0) {
                socket.emit("file-raw", { buffer: chunk, sender_uid: metadata.sender_uid, receiver_uid: metadata.receiver_uid });
            }
        });
    }

    socket.on('connect_error', (error) => {
        console.error('Connection Error:', error);
    });

    socket.on('error', (error) => {
        console.error('Socket Error:', error);
    });
})();
