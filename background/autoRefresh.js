let baseInterval = 60000; // ベースの間隔（ミリ秒）

// ランダムな間隔を計算する関数
function getRandomInterval(base, variance = 0.2) {
    const randomFactor = 1 + (Math.random() * 2 - 1) * variance; // -20% から +20% のランダム値
    return Math.round(base * randomFactor);
}

// タイムライン更新ボタンをクリックするスクリプト
function clickTimelineUpdateScript() {
    const button = document.querySelector(
        'div.css-175oi2r.r-sdzlij.r-dnmrzs.r-1awozwy.r-18u37iz.r-1777fci.r-xyw6el.r-o7ynqc.r-6416eg'
    );
    if (button) {
        button.click();
        console.log(new Date().toLocaleString(), ": refreshed timeline");
    } else {
        console.warn("タイムライン更新ボタンが見つかりませんでした");
    }
}

// アラームを設定する関数
function startAlarm(interval) {
    const randomInterval = getRandomInterval(interval); // ランダムな間隔を計算
    chrome.alarms.create("autoRefresh", { delayInMinutes: randomInterval / 60000 }); // 分単位で設定
    console.log(`次の更新は ${randomInterval / 1000} 秒後`);
}

// アラームを停止する関数
function stopAlarm() {
    chrome.alarms.clear("autoRefresh", () => {
        console.log("自動更新を停止しました");
    });
}

// アラームがトリガーされたときの動作
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "autoRefresh") {
        chrome.tabs.query({ url: "*://*.x.com/*" }, (tabs) => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: clickTimelineUpdateScript
                });
            }
        });
        startAlarm(baseInterval); // 次のアラームを設定
    }
});

// メッセージを受信して処理を実行
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        baseInterval = message.interval;
        startAlarm(baseInterval);
    } else if (message.action === "stop") {
        stopAlarm();
    }
});
