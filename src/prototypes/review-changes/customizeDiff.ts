import type { InjectionKey } from 'vue'
import type { ReviewChange } from '../template-dashboard-desktop-modal/reviewChanges'
import { wikimediaApiFetchHeaders } from '@/config'

export const customizeDiffKey: InjectionKey<() => void> = Symbol('customize-diff')
export interface DiffFilters { longSummaries: boolean; longTitles: boolean; longUsernames: boolean }
export const matchesFilters = (edit: { comment?: string; title: string; user?: string }, filters: DiffFilters) =>
  (!filters.longSummaries || (edit.comment?.trim().length ?? 0) >= 120) &&
  (!filters.longTitles || edit.title.length >= 40) &&
  (!filters.longUsernames || (edit.user?.length ?? 0) >= 20)

export async function fetchMatchingChanges(filters: DiffFilters, signal: AbortSignal): Promise<ReviewChange[]> {
  const matches: ReviewChange[] = []
  const titles = new Set<string>()
  let continuation: Record<string, string> = {}
  // Bound the search to 5,000 recent edits; never silently substitute non-matching edits.
  for (let page = 0; page < 10 && matches.length < 10; page++) {
    const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*',
      list: 'recentchanges', rctype: 'edit', rcnamespace: '0', rcshow: '!bot', rclimit: '500',
      rcprop: 'title|ids|user|timestamp|comment', ...continuation })
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, { signal, headers: wikimediaApiFetchHeaders('customize-diff') })
    if (!response.ok) throw new Error('Could not load recent edits. Please try again.')
    const result = await response.json()
    if (result.error) throw new Error(result.error.info || 'Wikipedia could not return edits.')
    for (const edit of result.query?.recentchanges ?? []) {
      if (!edit.revid || !edit.old_revid || !edit.user || titles.has(edit.title) || !matchesFilters(edit, filters)) continue
      const date = new Date(edit.timestamp)
      matches.push({ title: edit.title, description: '', editor: edit.user, summary: edit.comment ?? '',
        revisionId: edit.revid, oldRevisionId: edit.old_revid, wikiHost: 'en.wikipedia.org', time: 'Recently',
        revisionDate: `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}` })
      titles.add(edit.title)
      if (matches.length === 10) break
    }
    if (!result.continue) break
    continuation = result.continue
  }
  if (matches.length) {
    const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', prop: 'description', titles: matches.map(edit => edit.title).join('|') })
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, { signal, headers: wikimediaApiFetchHeaders('customize-diff-descriptions') })
    if (response.ok) {
      const data = await response.json()
      for (const page of data.query?.pages ?? []) {
        const edit = matches.find(edit => edit.title === page.title)
        if (edit) edit.description = page.description ?? ''
      }
    }
  }
  return matches
}
