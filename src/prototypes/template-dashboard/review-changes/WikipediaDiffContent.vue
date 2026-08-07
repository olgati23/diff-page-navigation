<script setup lang="ts">
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { onBeforeUnmount, ref, watch } from 'vue'

import { wikimediaApiFetchHeaders } from '@/config'
import type { ReviewChange } from '../reviewChanges'

const props = withDefaults(defineProps<{
  change: ReviewChange
  tall?: boolean
  showHeading?: boolean
}>(), {
  tall: false,
  showHeading: true,
})

const loading = ref(false)
const error = ref(false)
const documentHtml = ref('')
const frameHeight = ref(224)
let request: AbortController | null = null

function firstChangedSection(diffMarkup: string): string {
  const documentModel = new DOMParser().parseFromString(
    `<table><tbody>${diffMarkup}</tbody></table>`,
    'text/html',
  )
  const changedCell = documentModel.querySelector('.diff-addedline, .diff-deletedline')
  let row = changedCell?.closest('tr') ?? null

  while (row) {
    const heading = row.textContent?.match(/={2,}\s*([^=]+?)\s*={2,}/)?.[1]
    if (heading) return heading.trim()
    row = row.previousElementSibling as HTMLTableRowElement | null
  }

  return 'Changed content'
}

function diffDocument(diffMarkup: string): string {
  const documentModel = new DOMParser().parseFromString(
    `<table><tbody>${diffMarkup}</tbody></table>`,
    'text/html',
  )
  const rows = [...documentModel.querySelectorAll('tr')]
    .filter((row) => row.querySelector('.diff-addedline, .diff-deletedline'))
    .map((row) => {
      const removed = row.querySelector('.diff-deletedline > div')?.cloneNode(true) as
        | HTMLElement
        | undefined
      const added = row.querySelector('.diff-addedline > div')?.cloneNode(true) as
        | HTMLElement
        | undefined

      if (added) {
        const addedChanges = [...added.querySelectorAll('.diffchange, ins')]
        addedChanges.forEach((change) => change.classList.add('inline-added'))

        const removedChanges = removed
          ? [...removed.querySelectorAll('.diffchange, del')]
              .filter((change, index, changes) =>
                !changes.some((parent, parentIndex) => parentIndex < index && parent.contains(change)),
              )
          : []
        const firstAddition = added.querySelector('.inline-added')
        removedChanges.forEach((change) => {
          const deletion = documentModel.createElement('del')
          deletion.className = 'inline-removed'
          deletion.textContent = change.textContent
          if (firstAddition?.parentNode) {
            firstAddition.parentNode.insertBefore(deletion, firstAddition)
            firstAddition.parentNode.insertBefore(documentModel.createTextNode(' '), firstAddition)
          } else {
            added.append(deletion)
          }
        })
        return `<div class="change-inline">${added.innerHTML}</div>`
      }

      if (removed) {
        removed.querySelectorAll('.diffchange, del').forEach((change) =>
          change.classList.add('inline-removed'),
        )
        return `<div class="change-inline">${removed.innerHTML}</div>`
      }

      return ''
    })
    .join('')

  const heading = props.showHeading ? `<h2>${firstChangedSection(diffMarkup)}</h2>` : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; color: #202122; background: #f8f9fa; font: 14px/1.5 sans-serif; }
    main { padding: 0 16px 16px; }
    h2 { margin: 0 -16px 10px; padding: 8px 16px 0; color: #54595d; background: transparent;
      font-size: 14px; font-weight: 700; line-height: 1.5; }
    .change-inline { margin: 0 0 12px; padding: 0; }
    .change-inline > :first-child { margin-top: 0; }
    .change-inline > :last-child { margin-bottom: 0; }
    .inline-removed, del { background: #ff9f9b; text-decoration: line-through; }
    .inline-added, ins { background: #a3e6d4; text-decoration: underline; }
    a { color: #36c; }
    body.no-heading main { padding-top: 16px; }
  </style></head><body class="${props.showHeading ? '' : 'no-heading'}"><main>${heading}${rows}</main></body></html>`
}

function estimatedDiffHeight(diffMarkup: string): number {
  const documentModel = new DOMParser().parseFromString(
    `<table><tbody>${diffMarkup}</tbody></table>`,
    'text/html',
  )
  const changes = [...documentModel.querySelectorAll('.diff-addedline, .diff-deletedline')]
  const textLength = changes.reduce((total, change) => total + (change.textContent?.length ?? 0), 0)
  const estimatedLines = Math.ceil(textLength / 62)
  return 64 + changes.length * 28 + estimatedLines * 22
}

async function loadDiff(): Promise<void> {
  request?.abort()
  request = new AbortController()
  loading.value = true
  error.value = false
  documentHtml.value = ''
  frameHeight.value = 224

  try {
    const title = encodeURIComponent(props.change.title.replaceAll(' ', '_'))
    const revisionsResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&formatversion=2&prop=revisions&titles=${title}&rvprop=ids&rvlimit=2`,
      {
        signal: request.signal,
        headers: wikimediaApiFetchHeaders('desktop-review-changes-revisions'),
      },
    )
    if (!revisionsResponse.ok) throw new Error('Could not load revisions')
    const revisionsData = await revisionsResponse.json()
    const [current, previous] = revisionsData.query?.pages?.[0]?.revisions ?? []
    if (!current || !previous) throw new Error('Not enough revisions')

    const compareResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=compare&format=json&origin=*&fromrev=${previous.revid}&torev=${current.revid}&prop=diff`,
      {
        signal: request.signal,
        headers: wikimediaApiFetchHeaders('desktop-review-changes-compare'),
      },
    )
    if (!compareResponse.ok) throw new Error('Could not load comparison')
    const compareData = await compareResponse.json()
    const markup = compareData.compare?.body ?? compareData.compare?.['*'] ?? ''
    if (!markup) throw new Error('Empty comparison')
    if (props.tall) {
      const maximumHeight = Math.max(320, Math.floor(window.innerHeight * 0.62))
      frameHeight.value = Math.min(Math.max(estimatedDiffHeight(markup), 224), maximumHeight)
    }
    documentHtml.value = diffDocument(markup)
  } catch (caught) {
    if ((caught as Error).name !== 'AbortError') error.value = true
  } finally {
    loading.value = false
  }
}

function resizeFrame(event: Event): void {
  if (!props.tall) {
    frameHeight.value = 224
    return
  }

  try {
    const frame = event.currentTarget as HTMLIFrameElement
    const contentHeight = frame.contentDocument?.documentElement.scrollHeight ?? frameHeight.value
    const maximumHeight = Math.max(320, Math.floor(window.innerHeight * 0.62))
    frameHeight.value = Math.min(Math.max(contentHeight, frameHeight.value, 224), maximumHeight)
  } catch {
    // Keep the content-length estimate when the browser blocks frame measurement.
  }
}

watch(() => props.change, loadDiff, { immediate: true })
onBeforeUnmount(() => request?.abort())
</script>

<template>
  <div class="wikipedia-diff-content">
    <CdxProgressBar v-if="loading" aria-label="Loading Wikipedia diff" />
    <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
      The Wikipedia visual diff could not be loaded.
    </CdxMessage>
    <iframe
      v-else-if="documentHtml"
      :srcdoc="documentHtml"
      :style="{ height: `${frameHeight}px` }"
      title="Wikipedia visual diff"
      sandbox="allow-same-origin"
      @load="resizeFrame"
    />
  </div>
</template>

<style scoped>
.wikipedia-diff-content {
  min-height: 160px;
  background: #f8f9fa;
}

.wikipedia-diff-content iframe {
  display: block;
  width: 100%;
  height: 224px;
  border: 0;
  background: #f8f9fa;
}
</style>
