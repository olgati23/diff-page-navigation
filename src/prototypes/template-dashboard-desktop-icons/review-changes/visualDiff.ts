interface VisualDiffOptions {
  heading?: string | null
  showHeading?: boolean
  mobile?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function cleanRenderedText(html: string): string {
  const documentModel = new DOMParser().parseFromString(html, 'text/html')
  documentModel
    .querySelectorAll(
      'sup.reference, .mw-editsection, .mw-ref, .reference, style, script, table, figure, .navbox, .metadata',
    )
    .forEach((element) => element.remove())

  const content = documentModel.querySelector('.mw-parser-output') ?? documentModel.body
  return (content.textContent ?? '').replace(/\s+/g, ' ').trim()
}

async function renderWikitext(source: string, signal: AbortSignal): Promise<string> {
  if (!source.trim()) return ''

  const body = new URLSearchParams({
    action: 'parse',
    format: 'json',
    formatversion: '2',
    origin: '*',
    contentmodel: 'wikitext',
    prop: 'text',
    disableeditsection: '1',
    disablelimitreport: '1',
    text: source,
  })
  const response = await fetch('https://en.wikipedia.org/w/api.php', {
    method: 'POST',
    body,
    signal,
  })
  if (!response.ok) throw new Error('Could not render Wikipedia content')
  const data = await response.json()
  return cleanRenderedText(data.parse?.text ?? '')
}

function tokens(value: string): string[] {
  return value.match(/\s+|[^\s]+/g) ?? []
}

function inlineWordDiff(before: string, after: string): string {
  const oldTokens = tokens(before)
  const newTokens = tokens(after)

  if (!oldTokens.length) return `<ins data-diff-action="insert">${escapeHtml(after)}</ins>`
  if (!newTokens.length) return `<del data-diff-action="remove">${escapeHtml(before)}</del>`

  // Keep the prototype responsive if an unusually large paragraph is returned.
  if (oldTokens.length * newTokens.length > 180000) {
    return `<del data-diff-action="remove">${escapeHtml(before)}</del> <ins data-diff-action="insert">${escapeHtml(after)}</ins>`
  }

  const lengths = Array.from({ length: oldTokens.length + 1 }, () =>
    new Uint16Array(newTokens.length + 1),
  )
  for (let oldIndex = oldTokens.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newTokens.length - 1; newIndex >= 0; newIndex -= 1) {
      lengths[oldIndex][newIndex] = oldTokens[oldIndex] === newTokens[newIndex]
        ? lengths[oldIndex + 1][newIndex + 1] + 1
        : Math.max(lengths[oldIndex + 1][newIndex], lengths[oldIndex][newIndex + 1])
    }
  }

  let oldIndex = 0
  let newIndex = 0
  let html = ''
  let removed = ''
  let added = ''
  const flush = () => {
    if (removed) html += `<del data-diff-action="remove">${escapeHtml(removed)}</del>`
    if (added) html += `<ins data-diff-action="insert">${escapeHtml(added)}</ins>`
    removed = ''
    added = ''
  }

  while (oldIndex < oldTokens.length && newIndex < newTokens.length) {
    if (oldTokens[oldIndex] === newTokens[newIndex]) {
      flush()
      html += `<span data-diff-action="none">${escapeHtml(oldTokens[oldIndex])}</span>`
      oldIndex += 1
      newIndex += 1
    } else if (lengths[oldIndex + 1][newIndex] >= lengths[oldIndex][newIndex + 1]) {
      removed += oldTokens[oldIndex]
      oldIndex += 1
    } else {
      added += newTokens[newIndex]
      newIndex += 1
    }
  }
  while (oldIndex < oldTokens.length) removed += oldTokens[oldIndex++]
  while (newIndex < newTokens.length) added += newTokens[newIndex++]
  flush()
  return html
}

export async function buildVisualDiffDocument(
  diffMarkup: string,
  signal: AbortSignal,
  options: VisualDiffOptions = {},
): Promise<string> {
  const documentModel = new DOMParser().parseFromString(
    `<table><tbody>${diffMarkup}</tbody></table>`,
    'text/html',
  )
  const changedRows = [...documentModel.querySelectorAll('tr')].filter((row) =>
    row.querySelector('.diff-addedline, .diff-deletedline'),
  )

  const rows = await Promise.all(changedRows.map(async (row) => {
    const removedSource = row.querySelector('.diff-deletedline > div')?.textContent ?? ''
    const addedSource = row.querySelector('.diff-addedline > div')?.textContent ?? ''
    const [removed, added] = await Promise.all([
      renderWikitext(removedSource, signal),
      renderWikitext(addedSource, signal),
    ])
    if (!removed && !added) return ''
    return `<p class="change-inline">${inlineWordDiff(removed, added)}</p>`
  }))

  const showHeading = options.showHeading !== false
  const heading = showHeading
    ? `<h2>${escapeHtml(options.heading?.replaceAll('_', ' ') || 'Changed content')}</h2>`
    : ''
  const fontSize = options.mobile ? '16px' : '14px'
  const background = options.mobile ? '#fff' : '#f8f9fa'
  const headingBorder = options.mobile ? 'border-top: 1px solid #c8ccd1;' : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; color: #202122; background: ${background}; font: ${fontSize}/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Lato, Helvetica, Arial, sans-serif; }
    main { padding: ${showHeading ? '0 16px 16px' : '16px'}; }
    h2 { margin: 0 -16px 12px; padding: 12px 16px 0; ${headingBorder}
      color: #54595d; background: transparent; font-size: 14px; font-weight: 700; line-height: 1.5; }
    .ve-ui-diffElement { position: relative; }
    .ve-ui-diffElement::after { content: ''; clear: both; display: block; }
    .ve-ui-diffElement-content { position: relative; overflow-x: auto; margin-left: -5px; padding-left: 5px; }
    .change-inline { margin: 0 0 12px; padding: 0; }
    [data-diff-action='none'] { color: #54595d; }
    [data-diff-action='insert'], [data-diff-action='remove'] {
      position: relative; z-index: 1; text-decoration: inherit; white-space: break-spaces;
    }
    [data-diff-action='insert'] {
      background-color: rgba(0, 175, 137, 0.5); box-shadow: 0 0 0 1px rgba(0, 175, 137, 0.5);
    }
    [data-diff-action='remove'] {
      background-color: rgba(209, 29, 19, 0.5); box-shadow: 0 0 0 1px rgba(209, 29, 19, 0.5);
      text-decoration: line-through;
    }
    [data-diff-action='remove']:hover { text-decoration: none; }
    del[data-diff-action='remove'] + ins[data-diff-action='insert'],
    ins[data-diff-action='insert'] + del[data-diff-action='remove'] { margin-left: 4px; }
  </style></head><body><main>${heading}<div class="ve-ui-diffElement"><div class="ve-ui-diffElement-content">${rows.join('')}</div></div></main></body></html>`
}
