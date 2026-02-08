/**
 * Site Validator - Dashboard client
 * Handles SocketIO streaming, form submission, and result rendering.
 */

document.addEventListener('DOMContentLoaded', function () {
    const socket = io();

    // DOM elements
    const commandForm = document.getElementById('commandForm');
    const commandSelect = document.getElementById('command');
    const urlInput = document.getElementById('url');
    const pageUrlGroup = document.getElementById('pageUrlGroup');
    const pageUrlInput = document.getElementById('pageUrl');
    const saveGroup = document.getElementById('saveGroup');
    const runBtn = document.getElementById('runBtn');
    const statusBar = document.getElementById('statusBar');
    const statusText = document.getElementById('statusText');
    const logPanel = document.getElementById('logPanel');
    const clearLogBtn = document.getElementById('clearLog');
    const stdoutCard = document.getElementById('stdoutCard');
    const stdoutContent = document.getElementById('stdoutContent');
    const refreshBtn = document.getElementById('refreshResults');

    // Show/hide conditional fields based on selected command
    function updateFormFields() {
        const cmd = commandSelect.value;
        pageUrlGroup.classList.toggle('d-none', cmd !== 'analytics');
        saveGroup.classList.toggle('d-none', cmd !== 'html');
    }

    commandSelect.addEventListener('change', updateFormFields);
    updateFormFields();

    // Submit command via SocketIO
    commandForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const data = {
            command: commandSelect.value,
            url: urlInput.value,
            verbose: document.getElementById('verbose').checked,
        };

        if (commandSelect.value === 'analytics' && pageUrlInput.value) {
            data.page_url = pageUrlInput.value;
        }
        if (commandSelect.value === 'html' && document.getElementById('saveHtml').checked) {
            data.save = true;
        }

        // Clear log and stdout for a fresh run
        logPanel.innerHTML = '';
        stdoutCard.classList.add('d-none');
        stdoutContent.textContent = '';

        socket.emit('run_command', data);
        setRunning(true, data.command);
    });

    // SocketIO event: live log line
    socket.on('log_line', function (data) {
        appendLog(data.line);
    });

    // SocketIO event: command completed
    socket.on('command_complete', function (data) {
        setRunning(false);

        // Show stdout if present
        if (data.stdout && data.stdout.trim()) {
            stdoutContent.textContent = data.stdout;
            stdoutCard.classList.remove('d-none');
        }

        // Refresh results list
        refreshResultsList();
    });

    // SocketIO event: command error
    socket.on('command_error', function (data) {
        setRunning(false);
        appendLog('[ERROR] ' + data.error);

        if (data.stdout && data.stdout.trim()) {
            stdoutContent.textContent = data.stdout;
            stdoutCard.classList.remove('d-none');
        }
    });

    // Append a line to the log panel
    function appendLog(line) {
        const div = document.createElement('div');
        div.className = 'log-line';

        // Classify by log level for color-coding
        if (line.startsWith('[INFO]'))       div.classList.add('log-info');
        else if (line.startsWith('[WARN]'))  div.classList.add('log-warn');
        else if (line.startsWith('[ERROR]')) div.classList.add('log-error');
        else if (line.startsWith('[DEBUG]')) div.classList.add('log-debug');
        else if (line.startsWith('[UI]'))    div.classList.add('log-ui');

        div.textContent = line;
        logPanel.appendChild(div);

        // Auto-scroll to bottom
        logPanel.scrollTop = logPanel.scrollHeight;
    }

    // Toggle running state
    function setRunning(running, command) {
        if (running) {
            runBtn.disabled = true;
            runBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Running...';
            statusBar.classList.remove('d-none');
            statusText.textContent = 'Running "' + command + '"...';
        } else {
            runBtn.disabled = false;
            runBtn.innerHTML = '<i class="bi bi-play-fill"></i> Run';
            statusBar.classList.add('d-none');
        }
    }

    // Clear log panel
    clearLogBtn.addEventListener('click', function () {
        logPanel.innerHTML = '';
        stdoutCard.classList.add('d-none');
        stdoutContent.textContent = '';
    });

    // Clean output directory
    document.getElementById('cleanOutput').addEventListener('click', function () {
        if (!confirm('Delete all output files?')) return;
        fetch('/clean', { method: 'POST' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                appendLog('[UI] Cleaned output directory: removed ' + data.removed + ' file(s).');
                refreshResultsList();
            })
            .catch(function () {
                appendLog('[ERROR] Failed to clean output directory.');
            });
    });

    // Refresh results list
    refreshBtn.addEventListener('click', function () {
        refreshResultsList();
    });

    function refreshResultsList() {
        fetch('/results-list')
            .then(function (r) { return r.json(); })
            .then(function (files) {
                var list = document.getElementById('resultsList');
                if (!files.length) {
                    list.innerHTML = '<div class="list-group-item text-muted">No output files yet.</div>';
                    return;
                }
                list.innerHTML = files.map(function (f) {
                    var icon = f.is_json
                        ? 'bi-filetype-json text-warning'
                        : 'bi-file-text text-secondary';
                    return '<a href="/results/' + encodeURIComponent(f.name) + '"'
                        + ' class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">'
                        + '<div><i class="bi ' + icon + '"></i>'
                        + ' <span class="ms-1">' + f.name + '</span></div>'
                        + '<small class="text-muted">' + f.modified + '</small></a>';
                }).join('');
            })
            .catch(function () {});
    }

    // Check initial status on page load
    fetch('/status')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.running) {
                setRunning(true, data.current_command);
            }
        })
        .catch(function () {});
});
