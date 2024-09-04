const BOUNDARY = '--boundary--'

export const fromHtml = async (url: string, protocol: string, html: string) => {
	const lines = [
		`Snapshot-Content-Location: ${url}`,
		'MIME-Version: 1.0',
		`Content-Type: multipart/related; type="text/html"; boundary="${BOUNDARY}"`,
		'',
	]
	
	lines.push(...serializeResourceIncludeBoundary('text/html', null, url, makeHtmlAsciiOnlyAndUseCrlf(html)))
	
	const resources = await extractResources(html, protocol)
	
	for (const [oldUrl, newUrl] of resources) {
		html = html.replaceAll(oldUrl, newUrl)
	}
	
	lines.push(
		...await Promise.all(
			resources.map(async ([_, url, blob]) => {
				const base64 = await blobToBase64(blob)
				return serializeResourceIncludeBoundary(blob.type, 'base64', url, base64)
			})
		)
			.then(x => x.flat())
	)
	
	lines.push(`--${BOUNDARY}--`)
	
	return lines.join('\r\n')
}

const serializeResourceIncludeBoundary = (contentType: string, transferEncoding: string | null, url: string, content: string) => {
	return [
		`--${BOUNDARY}`,
		`Content-Type: ${contentType}`,
		...transferEncoding
			? [`Content-Transfer-Encoding: ${transferEncoding}`]
			: [],
		`Content-Location: ${url}`,
		'',
		content,
	]
}

const makeProtocolExplicit = (url: string, protocol: string) =>
	// protocol-relative URL
	url.startsWith('//') ? protocol + url : url
const extractResourceUrls = (html: string, protocol: string) =>
	[...html.matchAll(/(?:<a href="([^"]+?)"[^>]*>\s*)?(?<=<(?:video|img)[^>]*\bsrc=")(.+?)(?=")/g)]
		.map(([origUrl, url]) => [
			url,
			makeProtocolExplicit(origUrl ?? url, protocol),
		] as const)
const extractResources = (html: string, protocol: string) =>
	Promise.all(
		extractResourceUrls(html, protocol)
			.map(async ([oldUrl, renderingUrl]) => [
				oldUrl,
				renderingUrl,
				await fetch(renderingUrl)
					.then(r => r.blob()),
			] as const)
	)

const ASCII_LAST_CHAR = '\x7F'
const makeHtmlAsciiOnlyAndUseCrlf = (html: string) => {
	// 윈도우 기준 CRLF가 아니면 브라우저가 제대로 해석할 수 없음
	let res = ''
	let prevCh
	for (const ch of html) {
		res +=
			ch <= ASCII_LAST_CHAR
				? /*prevCh != '\r' && ch == '\n'
					? '\r\n'
					: */ch
				: `&#x${ch.codePointAt(0)?.toString(16)};`
		prevCh = ch
	}
	return res
}

export const blobToDataUrl = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('load', () => resolve(reader.result as string))
		reader.addEventListener('error', reject)
		reader.readAsDataURL(blob)
	})
const blobToBase64 = (blob: Blob) =>
	blobToDataUrl(blob).then(dataUrl =>
		dataUrl.substring(dataUrl.indexOf(',') + 1) // 'data:mime/type;base64,' 제거
	)
