const fs = require('fs');
let html = fs.readFileSync('host.html', 'utf8');

const newFn = `function sendReply() {
    const text = document.getElementById('reply-text').value.trim();
    if (!text) { showToast('Please type a reply first.'); return; }
    if (!replyTargetId) return;
    apiReplyMessage(replyTargetId, text)
        .then(data => {
            closeReplyModal();
            renderMessages();
            showToast(data.message || 'Reply sent to student email!');
        })
        .catch(err => showToast('Error: ' + err.message));
}`;

// Replace using regex
html = html.replace(/function sendReply\(\) \{[\s\S]*?window\.location\.href[\s\S]*?closeReplyModal\(\);[\s\S]*?showToast\([\s\S]*?\);\s*\}/, newFn);

fs.writeFileSync('host.html', html, 'utf8');
console.log('Done - sendReply now uses API');
