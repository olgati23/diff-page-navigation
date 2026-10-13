<script setup lang="ts">
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { CdxDialog, CdxRadio, CdxToggleSwitch, CdxField, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { fetchMatchingChanges, type DiffFilters } from '../customizeDiff'
import type { ReviewChange } from '../../template-dashboard-desktop-modal/reviewChanges'
const props = defineProps<{ open: boolean; version: string; filters: DiffFilters }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; apply: [version: string, filters: DiffFilters, edits: ReviewChange[]] }>()
const version = ref('Default')
const filters = reactive<DiffFilters>({ longSummaries: false, longTitles: false, longUsernames: false })
const loading = ref(false)
const error = ref('')
let request: AbortController | undefined
watch(() => props.open, open => {
  if (open) { version.value = props.version; Object.assign(filters, props.filters); error.value = '' }
  else { request?.abort(); loading.value = false }
})
onBeforeUnmount(() => request?.abort())
async function apply() {
  request?.abort()
  request = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const edits = await fetchMatchingChanges({ ...filters }, request.signal)
    if (!edits.length) { error.value = 'No matching edits found in the latest 5,000 edits. Try turning off a filter.'; return }
    emit('apply', version.value, { ...filters }, edits)
    emit('update:open', false)
  } catch (e) { if (e.name !== 'AbortError') error.value = e.message || 'Could not load edits. Please try again.' }
  finally { loading.value = false }
}
</script>
<template>
  <CdxDialog :open="open" title="Customize preview" use-close-button :primary-action="{ label: loading ? 'Loading edits…' : 'Apply', actionType: 'progressive', disabled: loading }" :default-action="{ label: 'Cancel' }" @update:open="emit('update:open', $event)" @primary="apply" @default="emit('update:open', false)">
    <CdxField is-fieldset>
      <template #label>Version</template>
      <CdxRadio v-for="option in ['Default', 'Older']" :key="option" v-model="version" name="diff-version" :input-value="option" :disabled="loading">{{ option }}</CdxRadio>
    </CdxField>
    <CdxField is-fieldset>
      <template #label>Edits to show</template>
      <div class="diff-filters">
        <CdxToggleSwitch align-switch v-model="filters.longSummaries" :disabled="loading">Long edit summaries <template #description>120 characters or more</template></CdxToggleSwitch>
        <CdxToggleSwitch align-switch v-model="filters.longTitles" :disabled="loading">Long titles <template #description>40 characters or more</template></CdxToggleSwitch>
        <CdxToggleSwitch align-switch v-model="filters.longUsernames" :disabled="loading">Long usernames <template #description>20 characters or more</template></CdxToggleSwitch>
      </div>
    </CdxField>
    <CdxProgressBar v-if="loading" aria-label="Finding matching edits" />
    <CdxMessage v-if="error" type="warning">{{ error }}</CdxMessage>
  </CdxDialog>
</template>
<style scoped>
.diff-filters { display: flex; flex-direction: column; gap: 12px; }
.cdx-progress-bar, .cdx-message { margin-top: 16px; }
</style>
