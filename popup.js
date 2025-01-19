let autoRefreshIsRunning = false;

document.getElementById("start-refresh-button").addEventListener("click", () => {
    const interval = parseInt(document.getElementById("interval").value, 10) * 1000;
    if (!autoRefreshIsRunning) {
        chrome.runtime.sendMessage({ action: "start_refresh", interval });
        document.getElementById("status").textContent = "ステータス: 実行中";
        document.getElementById("delete-promotion-status").textContent = "ステータス: 実行中";
        document.getElementById("start-refresh-button").textContent = "停止";
        autoRefreshIsRunning = true;
    } else {
        chrome.runtime.sendMessage({ action: "stop" });
        document.getElementById("status").textContent = "ステータス: 停止中";
        document.getElementById("start-refresh-button").textContent = "開始";
        autoRefreshIsRunning = false;
    }
});

document.getElementById("start-delete-promotion-button").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "delete_promotion", interval: 10 });
    document.getElementById("delete-promotion-status").textContent = "ステータス: 実行中";
    }
);