let autoRefreshIsRunning = false;

document.getElementById("toggle-button").addEventListener("click", () => {
    const interval = parseInt(document.getElementById("interval").value, 10) * 1000;
    if (!autoRefreshIsRunning) {
        chrome.runtime.sendMessage({ action: "start", interval });
        document.getElementById("status").textContent = "ステータス: 実行中";
        document.getElementById("toggle-button").textContent = "停止";
        autoRefreshIsRunning = true;
    } else {
        chrome.runtime.sendMessage({ action: "stop" });
        document.getElementById("status").textContent = "ステータス: 停止中";
        document.getElementById("toggle-button").textContent = "開始";
        autoRefreshIsRunning = false;
    }
});