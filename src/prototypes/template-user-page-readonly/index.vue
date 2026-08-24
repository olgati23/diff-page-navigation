<script setup lang="ts">
import { CdxButton, CdxIcon, CdxMessage } from '@wikimedia/codex'
import { cdxIconArrowPrevious, cdxIconUserAvatar } from '@wikimedia/codex-icons'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGermanPrototype } from '@/composables/useGermanPrototype'
import { useThaiPrototype } from '@/composables/useThaiPrototype'

definePage({
  meta: {
    title: 'User page preview',
    description: 'Read-only user-page preview for dashboard prototypes.',
  },
})

const route = useRoute()
if (route.query.lang === 'de') useGermanPrototype()
if (route.query.lang === 'th') useThaiPrototype()
const username = computed(() => String(route.query.username || 'Wikipedia editor'))

function goBack(): void {
  window.close()
  window.setTimeout(() => {
    if (!window.closed) window.history.back()
  }, 0)
}
</script>

<template>
  <main class="readonly-user-page">
    <header class="readonly-user-page__header">
      <CdxButton weight="quiet" :icon-only="true" aria-label="Back to prototype" @click="goBack">
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </CdxButton>
      <strong>Wikipedia</strong>
    </header>

    <article class="readonly-user-page__content">
      <CdxMessage type="notice" :allow-user-dismiss="false">
        Read-only prototype preview. Links, editing, and other actions are unavailable.
      </CdxMessage>

      <div class="readonly-user-page__identity">
        <CdxIcon :icon="cdxIconUserAvatar" size="medium" />
        <div>
          <h1>User:{{ username }}</h1>
          <p>Wikipedia editor</p>
        </div>
      </div>

      <nav class="readonly-user-page__tabs" aria-label="User page sections">
        <span aria-current="page">User page</span>
        <span>Talk</span>
      </nav>

      <section>
        <h2>About this user</h2>
        <p>
          This is a read-only preview of {{ username }}’s user page for the dashboard study.
          No changes made here are connected to Wikipedia.
        </p>
      </section>

      <section>
        <h2>Contributions</h2>
        <p>This editor contributes to articles and discussions across Wikipedia.</p>
      </section>
    </article>
  </main>
</template>

<style scoped>
.readonly-user-page {
  min-height: 100vh;
  color: var(--color-base, #202122);
  background: var(--background-color-base, #fff);
}

.readonly-user-page__header {
  position: sticky;
  z-index: 1;
  top: 0;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 46px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.readonly-user-page__content {
  box-sizing: border-box;
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.readonly-user-page__identity {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 24px 0 16px;
}

.readonly-user-page h1,
.readonly-user-page h2,
.readonly-user-page p {
  margin-top: 0;
}

.readonly-user-page h1 {
  margin-bottom: 4px;
  font-family: Georgia, serif;
  font-size: 2rem;
  line-height: 1.2;
}

.readonly-user-page__identity p {
  margin-bottom: 0;
  color: var(--color-subtle, #54595d);
}

.readonly-user-page__tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.readonly-user-page__tabs span {
  padding: 8px 0;
  color: var(--color-subtle, #54595d);
}

.readonly-user-page__tabs [aria-current='page'] {
  margin-bottom: -1px;
  border-bottom: 2px solid var(--border-color-progressive--active, #2a4b8d);
  color: var(--color-base, #202122);
  font-weight: 700;
}

.readonly-user-page section {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

@media (min-width: 720px) {
  .readonly-user-page__content {
    padding: 32px;
  }
}
</style>
