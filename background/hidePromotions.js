// プロモーションツイートを非表示にする関数
function hidePromotedTweets() {
    const tweets = document.querySelectorAll('div[data-testid="cellInnerDiv"]');

    tweets.forEach((tweet) => {
        // より柔軟な条件でプロモーションを特定
        const isPromoted = tweet.innerText.includes("プロモーション");

        if (isPromoted) {
            tweet.style.display = "none";
            console.log("プロモーションツイートを非表示にしました:\n", tweet.innerText);
        }
    });
}

// MutationObserverで常にプロモーションツイートを監視
// エラーが出たので保留、動作には問題なし
// function observePromotedTweets() {
//     const observer = new MutationObserver(hidePromotedTweets);
//     observer.observe(document.body, {
//         childList: true,
//         subtree: true
//     });
//     console.log("プロモーションツイートの監視を開始しました");
// }

// プロモーションツイートの定期的な非表示処理
function startHidePromotions(interval) {
    chrome.alarms.create("hidePromotions", { delayInMinutes: 0, periodInMinutes: interval / 60000 });
    console.log("プロモーションツイート非表示処理が開始されました");
    // observePromotedTweets();
}

// プロモーションツイート非表示処理を停止
function stopHidePromotions() {
    chrome.alarms.clear("hidePromotions", () => {
        console.log("プロモーションツイート非表示処理が停止されました");
    });
}

// アラームリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "hidePromotions") {
        chrome.tabs.query({ url: "*://*.x.com/*" }, (tabs) => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: hidePromotedTweets
                });
            }
        });
    }
});

// メッセージを受信して処理を実行
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        baseInterval = message.interval;
        startHidePromotions(baseInterval);
    } else if (message.action === "stop") {
        stopHidePromotions();
    }
});
