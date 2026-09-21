importScripts('selectors.js');

const REFRESH_ALARM = 'autoRefresh';
const PROMOTION_ALARM = 'hidePromotions';
const DEFAULT_INTERVAL = 60;
const PROMOTION_INTERVAL_MINUTES = 1;

function nextRefreshDelay(seconds) {
    return Math.max(30, seconds * (0.8 + Math.random() * 0.4)) / 60;
}

async function scheduleRefresh(seconds) {
    await chrome.alarms.create(REFRESH_ALARM, { delayInMinutes: nextRefreshDelay(seconds) });
}

async function refreshTimeline() {
    const tabs = await chrome.tabs.query({ url: ['*://x.com/home*', '*://www.x.com/home*'] });
    if (!tabs.length) {
        console.info(`[${new Date().toLocaleString()}] X のホームタブが見つかりません`);
        return;
    }
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                    console.info(`[${new Date().toLocaleString()}] タイムラインを更新しました`);
                }
                return Boolean(button);
            },
            args: [SELECTORS.timelineUpdateButton],
        });
        if (results[0]?.result) {
            console.info(`[${new Date().toLocaleString()}] タイムラインを更新しました (タブ ${tabs[0].id})`);
        } else {
            console.warn('更新ボタンが見つかりません。src/selectors.js を確認してください。');
        }
    } catch (error) {
        console.error('タイムラインの更新に失敗しました', error);
    }
}

async function hidePromotions() {
    const tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://www.x.com/*'] });
    for (const tab of tabs) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (selector, labels) => {
                    for (const tweet of document.querySelectorAll(selector)) {
                        if (labels.some(label => tweet.innerText.includes(label))) tweet.style.display = 'none';
                    }
                },
                args: [SELECTORS.tweet, SELECTORS.promotionLabels],
            });
        } catch (error) {
            console.error('広告の非表示に失敗しました', error);
        }
    }
}

async function restoreAlarms() {
    const { refreshEnabled = false, promotionsEnabled = false, intervalSeconds = DEFAULT_INTERVAL } =
        await chrome.storage.local.get(['refreshEnabled', 'promotionsEnabled', 'intervalSeconds']);
    if (refreshEnabled && !await chrome.alarms.get(REFRESH_ALARM)) await scheduleRefresh(intervalSeconds);
    if (promotionsEnabled && !await chrome.alarms.get(PROMOTION_ALARM)) {
        await chrome.alarms.create(PROMOTION_ALARM, { periodInMinutes: PROMOTION_INTERVAL_MINUTES });
    }
}

chrome.runtime.onStartup.addListener(restoreAlarms);
chrome.runtime.onInstalled.addListener(restoreAlarms);

chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name === REFRESH_ALARM) {
        const { refreshEnabled = false, intervalSeconds = DEFAULT_INTERVAL } =
            await chrome.storage.local.get(['refreshEnabled', 'intervalSeconds']);
        if (!refreshEnabled) return;
        await refreshTimeline();
        await scheduleRefresh(intervalSeconds);
    } else if (alarm.name === PROMOTION_ALARM) {
        const { promotionsEnabled = false } = await chrome.storage.local.get('promotionsEnabled');
        if (promotionsEnabled) await hidePromotions();
    }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
        if (message.action === 'getState') {
            return await chrome.storage.local.get(['refreshEnabled', 'promotionsEnabled', 'intervalSeconds']);
        }
        if (message.action === 'setRefresh') {
            if (message.enabled) {
                const seconds = Number(message.intervalSeconds);
                if (!Number.isFinite(seconds) || seconds < 30) throw new Error('更新間隔は30秒以上にしてください');
                await chrome.storage.local.set({ refreshEnabled: true, intervalSeconds: seconds });
                await scheduleRefresh(seconds);
            } else {
                await chrome.storage.local.set({ refreshEnabled: false });
                await chrome.alarms.clear(REFRESH_ALARM);
            }
        } else if (message.action === 'setPromotions') {
            await chrome.storage.local.set({ promotionsEnabled: Boolean(message.enabled) });
            if (message.enabled) {
                await chrome.alarms.create(PROMOTION_ALARM, { periodInMinutes: PROMOTION_INTERVAL_MINUTES });
                await hidePromotions();
            } else {
                await chrome.alarms.clear(PROMOTION_ALARM);
            }
        } else {
            throw new Error('不明な操作です');
        }
        return await chrome.storage.local.get(['refreshEnabled', 'promotionsEnabled', 'intervalSeconds']);
    })().then(state => sendResponse({ state })).catch(error => sendResponse({ error: error.message }));
    return true;
});
