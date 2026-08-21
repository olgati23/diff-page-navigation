<script setup lang="ts">
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { wikimediaApiFetchHeaders } from '@/config'
import type { ReviewChange } from '../reviewChanges'
import { buildVisualDiffDocument } from './visualDiff'

const props = withDefaults(defineProps<{
  change: ReviewChange
  tall?: boolean
  showHeading?: boolean
  heightOffset?: number
}>(), {
  tall: false,
  showHeading: true,
  heightOffset: 0,
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

function maximumDiffHeight(): number {
  return Math.max(284, Math.floor(window.innerHeight * 0.62) - props.heightOffset)
}

async function loadDiff(): Promise<void> {
  request?.abort()
  request = new AbortController()
  loading.value = true
  error.value = false
  documentHtml.value = ''
  frameHeight.value = props.tall ? maximumDiffHeight() : 224

  try {
    const compareResponse = await fetch(
      `https://${props.change.wikiHost ?? 'en.wikipedia.org'}/w/api.php?action=compare&format=json&origin=*&fromrev=${props.change.oldRevisionId}&torev=${props.change.revisionId}&prop=diff`,
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
      frameHeight.value = maximumDiffHeight()
    }
    documentHtml.value = await buildVisualDiffDocument(markup, request.signal, {
      heading: firstChangedSection(markup),
      showHeading: props.showHeading,
      wikiHost: props.change.wikiHost,
      mobile: true,
    })
  } catch (caught) {
    if ((caught as Error).name !== 'AbortError') error.value = true
  } finally {
    loading.value = false
  }
}

function resizeFrame(): void {
  if (!props.tall) {
    frameHeight.value = 224
    return
  }

  // Modal previews deliberately keep the same maximum height while moving
  // through the review queue. The iframe itself scrolls shorter or longer diffs.
  frameHeight.value = maximumDiffHeight()
}

watch(() => props.change, loadDiff, { immediate: true })
watch(() => props.heightOffset, resizeFrame)
onMounted(() => window.addEventListener('resize', resizeFrame))
onBeforeUnmount(() => {
  request?.abort()
  window.removeEventListener('resize', resizeFrame)
})
</script>

<template>
  <div
    class="wikipedia-diff-content"
    :class="{ 'wikipedia-diff-content--tall': props.tall }"
    :style="props.tall ? { height: `${frameHeight}px` } : undefined"
  >
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
  background: #fff;
}

.wikipedia-diff-content--tall {
  overflow: hidden;
}

.wikipedia-diff-content iframe {
  display: block;
  width: 100%;
  height: 224px;
  border: 0;
  background: #fff;
}
</style>
