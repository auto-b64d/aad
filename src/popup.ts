chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
	if (!/^\w+:\/\/arca\.live\//.test(tab.url!)) return
	
	await chrome.tabs.sendMessage(tab.id!, { type: 'content-download' })
	
	window.close()
})
