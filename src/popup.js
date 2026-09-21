const refreshButton = document.getElementById('refresh-button');
const promotionsButton = document.getElementById('promotions-button');
const intervalInput = document.getElementById('interval');
const errorElement = document.getElementById('error');
let state = { refreshEnabled: false, promotionsEnabled: false, intervalSeconds: 60 };

function render() {
    for (const [key, button, status] of [
        ['refreshEnabled', refreshButton, document.getElementById('refresh-status')],
        ['promotionsEnabled', promotionsButton, document.getElementById('promotions-status')],
    ]) {
        const enabled = Boolean(state[key]);
        button.textContent = enabled ? '停止する' : '開始する';
        status.textContent = enabled ? '実行中' : '停止中';
        status.classList.toggle('active', enabled);
    }
    intervalInput.disabled = Boolean(state.refreshEnabled);
}

async function request(message) {
    errorElement.textContent = '';
    const response = await chrome.runtime.sendMessage(message);
    if (response?.error) throw new Error(response.error);
    state = { ...state, ...response.state };
    render();
}

async function run(message) {
    refreshButton.disabled = true;
    promotionsButton.disabled = true;
    try {
        await request(message);
    } catch (error) {
        errorElement.textContent = error.message;
    } finally {
        refreshButton.disabled = false;
        promotionsButton.disabled = false;
    }
}

refreshButton.addEventListener('click', () => {
    run({ action: 'setRefresh', enabled: !state.refreshEnabled, intervalSeconds: Number(intervalInput.value) });
});
promotionsButton.addEventListener('click', () => {
    run({ action: 'setPromotions', enabled: !state.promotionsEnabled });
});

request({ action: 'getState' }).then(() => {
    intervalInput.value = state.intervalSeconds;
}).catch(error => { errorElement.textContent = error.message; });
