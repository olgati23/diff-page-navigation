<script setup lang="ts">
import { CdxButton, CdxDialog, CdxTextInput } from '@wikimedia/codex'
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  desktop?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirmed: []
}>()

const reason = ref('')
const reasonInput = ref<InstanceType<typeof CdxTextInput> | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (open) reason.value = ''
    if (open && !props.desktop) {
      await nextTick()
      const input = reasonInput.value?.$el?.querySelector('input') as HTMLInputElement | null
      input?.focus()
    }
  },
)

function close(): void {
  emit('update:open', false)
}

function confirm(): void {
  emit('confirmed')
  close()
}
</script>

<template>
  <CdxDialog
    :open="props.open"
    title="Undo"
    class="undo-confirmation-dialog"
    :class="{ 'undo-confirmation-dialog--desktop': props.desktop }"
    @update:open="emit('update:open', $event)"
  >
    <p class="undo-confirmation-dialog__description">
      This will undo the change(s) shown in this revision. Please provide a reason for undoing
      the edit(s).
    </p>
    <CdxTextInput
      ref="reasonInput"
      v-model="reason"
      :autofocus="!props.desktop"
      placeholder="eg. Inaccurate information"
      aria-label="Reason for undoing the edit"
    />
    <div
      class="undo-confirmation-dialog__actions"
      :class="{ 'undo-confirmation-dialog__actions--desktop': props.desktop }"
    >
      <template v-if="props.desktop">
        <CdxButton weight="normal" @click="close">Cancel</CdxButton>
        <CdxButton action="progressive" weight="normal" @click="confirm">Undo</CdxButton>
      </template>
      <template v-else>
        <CdxButton action="progressive" weight="normal" @click="confirm">Undo</CdxButton>
        <CdxButton weight="normal" @click="close">Cancel</CdxButton>
      </template>
    </div>
  </CdxDialog>
</template>

<style scoped>
.undo-confirmation-dialog__description {
  margin: 0 0 var(--spacing-100, 16px);
  font-size: var(--font-size-medium, 1rem);
  line-height: 1.6;
}

.undo-confirmation-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  margin-top: var(--spacing-150, 24px);
}

.undo-confirmation-dialog__actions .cdx-button {
  width: 100%;
  max-width: none;
}

.undo-confirmation-dialog__actions--desktop {
  flex-direction: row;
  justify-content: flex-end;
}

.undo-confirmation-dialog__actions--desktop .cdx-button {
  width: auto;
  min-width: 88px;
}
</style>

<style>
.cdx-dialog-backdrop:has(.undo-confirmation-dialog) {
  z-index: 1100;
}

.undo-confirmation-dialog {
  max-width: 512px;
}

.undo-confirmation-dialog .cdx-dialog__header__close-button {
  display: none;
}
</style>
