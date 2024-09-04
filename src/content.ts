chrome.runtime.onMessage.addListener(msg => {
	if (msg.type != 'content-download') return
	
	chrome.runtime.sendMessage({
		type: 'sw-download',
		url: location.href,
		protocol: location.protocol,
		articleId: location.pathname.split('/').at(-1),
		articleBodyHtml:
			document.querySelector('.article-body')
				?.outerHTML
				?.replace(/&(?:amp|lt|gt|quot|#(0+)?39);/g, m => // from lodash
					({
						'&amp;': '&',
						'&lt;': '<',
						'&gt;': '>',
						'&quot;': '"',
						'&#39;': '\'',
					})[m] ?? '\''
				),
	})
})
