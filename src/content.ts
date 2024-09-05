chrome.runtime.onMessage.addListener(msg => {
	if (msg.type != 'content-download') return
	
	if (!document.querySelector('.article-wrapper')) return // 글 페이지가 아님
	
	chrome.runtime.sendMessage({
		type: 'sw-download',
		url: location.href,
		articleId: location.pathname.split('/').at(-1),
		articleTitle: [...document.querySelector('.article-head .title')!.childNodes].at(-1)!.textContent!.trim(),
		articleBodyHtml:
			document.querySelector('.article-body')!
				.outerHTML
				.replace(/&(?:amp|lt|gt|quot|#(0+)?39);/g, m => // from lodash
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
