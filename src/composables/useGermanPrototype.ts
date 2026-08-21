import { onBeforeUnmount, onMounted } from 'vue'

const replacements: Array<[string, string]> = [
  ['Hello, NewEditor!', 'Hallo, NewEditor!'],
  ['Share feedback', 'Feedback teilen'],
  ['Preview style', 'Vorschauart'],
  ['Review changes', 'Änderungen prüfen'],
  ['These edits were made by other users. Stay up to date and help maintain Wikipedia’s quality by reviewing them.', 'Diese Änderungen wurden von anderen Benutzern vorgenommen. Prüfe sie und hilf dabei, die Qualität von Wikipedia zu erhalten.'],
  ["These edits were made by other users. Stay up to date and help maintain Wikipedia's quality by reviewing them.", 'Diese Änderungen wurden von anderen Benutzern vorgenommen. Prüfe sie und hilf dabei, die Qualität von Wikipedia zu erhalten.'],
  ['Your impact', 'Dein Beitrag'],
  ['Thanks sent', 'Gesendete Danksagungen'],
  ['Edits reviewed', 'Geprüfte Bearbeitungen'],
  ['Policies and guidelines', 'Richtlinien'],
  ['Check what is acceptable and expected on Wikipedia.', 'Informiere dich, was auf Wikipedia akzeptiert und erwartet wird.'],
  ['Neutral point of view', 'Neutraler Standpunkt'],
  ['No original research', 'Keine Theoriefindung'],
  ['Verifiability', 'Belegpflicht'],
  ['Assume good faith', 'Gehe von guten Absichten aus'],
  ['Content must represent significant views fairly, proportionately, and without bias.', 'Inhalte müssen relevante Standpunkte fair, angemessen und ohne Voreingenommenheit darstellen.'],
  ['Articles should summarise published sources, and not contain users’ own interpretation or knowledge.', 'Artikel sollen veröffentlichte Quellen zusammenfassen und keine eigenen Interpretationen oder unveröffentlichtes Wissen enthalten.'],
  ['New additions should include a citation, providing the source of the information.', 'Neue Inhalte sollen mit einem Beleg versehen sein, der die Quelle der Information nennt.'],
  ['Remember that Wikipedia editors are trying to improve Wikipedia and not deliberately reduce its quality.', 'Denke daran, dass Wikipedia-Benutzer die Enzyklopädie verbessern möchten und ihre Qualität nicht absichtlich mindern.'],
  ['Active discussions', 'Aktive Diskussionen'],
  ['View more edits', 'Weitere Bearbeitungen'],
  ['View more', 'Mehr anzeigen'],
  ['Latest comment:', 'Letzter Kommentar:'],
  ['18 minutes ago', 'vor 18 Minuten'],
  ['What should mentorship be?', 'Wie sollte Mentoring gestaltet sein?'],
  ['Open', 'Öffnen'],
  ['Check best practices to create a free and reliable encyclopedia.', 'Bewährte Vorgehensweisen für eine freie und verlässliche Enzyklopädie kennenlernen.'],
  ['Prüfen best practices to create a free and reliable encyclopedia.', 'Bewährte Vorgehensweisen für eine freie und verlässliche Enzyklopädie kennenlernen.'],
  ['This is a prototype made with ProtoWiki.', 'Dies ist ein mit ProtoWiki erstellter Prototyp.'],
  ['Privacy policy', 'Datenschutzrichtlinie'],
  ['Contact Wikipedia', 'Wikipedia kontaktieren'],
  ['Legal & safety contacts', 'Rechtliche und Sicherheitskontakte'],
  ['Code of Conduct', 'Verhaltenskodex'],
  ['Developers', 'Entwickler'],
  ['Statistics', 'Statistiken'],
  ['Cookie statement', 'Cookie-Erklärung'],
  ['Terms of Use', 'Nutzungsbedingungen'],
  ['Desktop view', 'Desktopansicht'],
  ['Mobile view', 'Mobile Ansicht'],
  ['About Wikipedia', 'Über Wikipedia'],
  ['Disclaimers', 'Haftungsausschluss'],
  ['View more edits in the recent changes page', 'Weitere Bearbeitungen auf der Seite Letzte Änderungen ansehen'],
  ['View more edits in the', 'Weitere Bearbeitungen auf der'],
  ['recent changes page', 'Seite „Letzte Änderungen“'],
  ['Preview change', 'Änderung ansehen'],
  ['We need to get rid of the "suggested links" tool', 'Das Werkzeug „Vorgeschlagene Links“ sollte entfernt werden'],
  ['Category:Category', 'Kategorie:Kategorie'],
  ['Merge PROSPLIT into AfD?', 'PROSPLIT mit AfD zusammenführen?'],
  ['Wikipedia:Village pump (proposals)', 'Wikipedia:Fragen zur Wikipedia (Vorschläge)'],
  ['Wikipedia:Village pump (technical)', 'Wikipedia:Fragen zur Wikipedia (Technik)'],
  ['Wikipedia:Village pump (idea_lab)', 'Wikipedia:Fragen zur Wikipedia (Ideenwerkstatt)'],
  ['22 minutes ago', 'vor 22 Minuten'],
  ['2 hours ago', 'vor 2 Stunden'],
  ['Diff preview', 'Versionsunterschied'],
  ['Difference between revisions', 'Unterschied zwischen Versionen'],
  ['Revision from:', 'Version vom:'],
  ['Revision from ', 'Version vom '],
  ['Edit details', 'Bearbeitungsdetails'],
  ['Edit summary:', 'Zusammenfassung:'],
  ['Tags:', 'Markierungen:'],
  ['Changed content', 'Geänderter Inhalt'],
  ['50,000,000 edits', '50.000.000 Bearbeitungen'],
  ['23 user groups', '23 Benutzergruppen'],
  ['About user groups', 'Über Benutzergruppen'],
  ['About review changes', 'Über Änderungen prüfen'],
  ['Suggested changes to review', 'Vorgeschlagene Änderungen zur Prüfung'],
  ['Revision navigation', 'Versionsnavigation'],
  ['Full diff', 'Vollständiger Unterschied'],
  ['Thanked', 'Gedankt'],
  ['Thank', 'Danken'],
  ['Undo edit', 'Bearbeitung rückgängig machen'],
  ['Undo', 'Rückgängig'],
  ['Restore', 'Wiederherstellen'],
  ['Reviewed', 'Geprüft'],
  ['Review', 'Prüfen'],
  ['Cancel', 'Abbrechen'],
  ['Publicly send ‘Thanks’', 'Öffentlich „Danke“ senden'],
  ["Publicly send 'Thanks'", 'Öffentlich „Danke“ senden'],
  ['It is an easy way to show appreciation for an editor’s work on Wikipedia. ‘Thanks’ cannot be undone and are publicly viewable.', 'Damit kannst du deine Wertschätzung für die Arbeit eines Benutzers auf Wikipedia zeigen. Ein „Danke“ kann nicht rückgängig gemacht werden und ist öffentlich sichtbar.'],
  ['This will undo the change(s) shown in this revision. Please provide a reason for undoing the edit(s).', 'Dadurch werden die in dieser Version gezeigten Änderungen rückgängig gemacht. Bitte gib einen Grund dafür an.'],
  ['eg. Inaccurate information', 'z. B. ungenaue Informationen'],
  ["A 'Thanks' cannot be undone", 'Ein „Danke“ kann nicht rückgängig gemacht werden.'],
  ['Previous review change', 'Vorherige Änderung'],
  ['Next review change', 'Nächste Änderung'],
  ['Back to dashboard', 'Zurück zum Dashboard'],
  ['Back to review changes', 'Zurück zu den Änderungen'],
  ['Edit marked as reviewed on your dashboard only.', 'Bearbeitung nur auf deinem Dashboard als geprüft markiert.'],
  ['Edit marked as unreviewed on your dashboard only.', 'Bearbeitung nur auf deinem Dashboard als ungeprüft markiert.'],
  ['Edit restored.', 'Bearbeitung wiederhergestellt.'],
  ['Your edit was saved.', 'Deine Bearbeitung wurde gespeichert.'],
  ['Edit undone', 'Bearbeitung rückgängig gemacht'],
  ['Opening Wikipedia', 'Wikipedia öffnen'],
  ['You are leaving the prototype and opening Wikipedia. Any edits or action made there are public', 'Du verlässt den Prototyp und öffnest Wikipedia. Alle dort vorgenommenen Bearbeitungen oder Aktionen sind öffentlich.'],
  ['Got it', 'Verstanden'],
  ['Back to prototype', 'Zurück zum Prototyp'],
  ['Read-only prototype preview. Links, editing, and other actions are unavailable.', 'Schreibgeschützte Prototypansicht. Links, Bearbeitungen und weitere Aktionen sind nicht verfügbar.'],
  ['Wikipedia editor', 'Wikipedia-Benutzer'],
  ['User page sections', 'Bereiche der Benutzerseite'],
  ['User page', 'Benutzerseite'],
  ['Talk', 'Diskussion'],
  ['About this user', 'Über diesen Benutzer'],
  ['Contributions', 'Beiträge'],
  ['This editor contributes to articles and discussions across Wikipedia.', 'Dieser Benutzer arbeitet an Artikeln und Diskussionen in Wikipedia mit.'],
]

function translateText(value: string): string {
  let translated = value
  translated = translated.replace(/^(\s*)(.+) edited the (.+) article(\s*)$/, '$1$2 hat den Artikel $3 bearbeitet$4')
  translated = translated.replace(/Publicly send [‘']Thanks[’']/g, 'Öffentlich „Danke“ senden')
  translated = translated.replace(
    /It is an easy way to show appreciation for an editor[’']s work on Wikipedia\. [‘']Thanks[’'] cannot be undone and are publicly viewable\./g,
    'Damit kannst du deine Wertschätzung für die Arbeit eines Benutzers auf Wikipedia zeigen. Ein „Danke“ kann nicht rückgängig gemacht werden und ist öffentlich sichtbar.',
  )
  translated = translated.replace(/A [‘']Thanks[’'] cannot be undone\.?/g, 'Ein „Danke“ kann nicht rückgängig gemacht werden.')
  translated = translated.replace(/You thanked (.+)\./g, 'Du hast $1 gedankt.')
  for (const [source, target] of replacements) translated = translated.replaceAll(source, target)
  return translated
}

function translateTree(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const translated = translateText(node.nodeValue ?? '')
    if (translated !== node.nodeValue) node.nodeValue = translated
  }

  root.querySelectorAll?.('[aria-label], [placeholder], a[href]').forEach((element) => {
    for (const attribute of ['aria-label', 'placeholder']) {
      const value = element.getAttribute(attribute)
      if (value) element.setAttribute(attribute, translateText(value))
    }
    if (element instanceof HTMLAnchorElement) {
      element.href = element.href
        .replace('/template-dashboard-mobile-card/', '/template-dashboard-mobile-card-de/')
        .replace('/template-dashboard-mobile-card$', '/template-dashboard-mobile-card-de')
        .replace('/template-dashboard-mobile-toolbar/', '/template-dashboard-mobile-toolbar-de/')
        .replace('/template-dashboard-mobile-toolbar$', '/template-dashboard-mobile-toolbar-de')
      if (element.href.includes('template-user-page-readonly') || element.href.includes('template-full-diff-readonly')) {
        const url = new URL(element.href)
        url.searchParams.set('lang', 'de')
        element.href = url.toString()
      }
    }
  })
}

export function useGermanPrototype(): void {
  let observer: MutationObserver | null = null
  onMounted(() => {
    document.documentElement.lang = 'de'
    translateTree(document.body)
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const textNode = mutation.target as Text
          const translated = translateText(textNode.nodeValue ?? '')
          if (translated !== textNode.nodeValue) textNode.nodeValue = translated
          continue
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) translateTree(node as Element)
          else if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateTree(node.parentElement)
        })
      }
    })
    observer.observe(document.body, { childList: true, characterData: true, subtree: true })
  })
  onBeforeUnmount(() => observer?.disconnect())
}
