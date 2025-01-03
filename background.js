// 必要な初期化やグローバルイベントリスナーを設定
console.log("バックグラウンドサービスワーカーが起動しました");

importScripts(
    "./background/hidePromotions.js",
    "./background/autoRefresh.js",
);