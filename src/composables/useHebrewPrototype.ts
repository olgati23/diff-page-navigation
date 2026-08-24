import { onBeforeUnmount, onMounted } from 'vue'

const replacements: Array<[string, string]> = [
  ['Hello, NewEditor!', 'שלום, NewEditor!'],
  ['Share feedback', 'שיתוף משוב'],
  ['Preview style', 'סגנון תצוגה מקדימה'],
  ['Review changes', 'בדיקת שינויים'],
  ['These edits were made by other users. Stay up to date and help maintain Wikipedia’s quality by reviewing them.', 'עריכות אלה נעשו בידי משתמשים אחרים. הישארו מעודכנים ועזרו לשמור על איכות ויקיפדיה באמצעות בדיקתן.'],
  ["These edits were made by other users. Stay up to date and help maintain Wikipedia's quality by reviewing them.", 'עריכות אלה נעשו בידי משתמשים אחרים. הישארו מעודכנים ועזרו לשמור על איכות ויקיפדיה באמצעות בדיקתן.'],
  ['Your impact', 'ההשפעה שלך'],
  ['Thanks sent', 'תודות שנשלחו'],
  ['Edits reviewed', 'עריכות שנבדקו'],
  ['Policies and guidelines', 'מדיניות והנחיות'],
  ['Check what is acceptable and expected on Wikipedia.', 'בדקו מה מקובל ומצופה בוויקיפדיה.'],
  ['Neutral point of view', 'נקודת מבט ניטרלית'],
  ['No original research', 'אין מחקר מקורי'],
  ['Verifiability', 'אימות'],
  ['Assume good faith', 'הנחת כוונה טובה'],
  ['Content must represent significant views fairly, proportionately, and without bias.', 'התוכן חייב להציג עמדות משמעותיות באופן הוגן, מידתי וללא הטיה.'],
  ['Articles should summarise published sources, and not contain users’ own interpretation or knowledge.', 'ערכים צריכים לסכם מקורות שפורסמו ולא לכלול פרשנות או ידע אישי של משתמשים.'],
  ['New additions should include a citation, providing the source of the information.', 'תוכן חדש צריך לכלול הערת שוליים המציינת את מקור המידע.'],
  ['Remember that Wikipedia editors are trying to improve Wikipedia and not deliberately reduce its quality.', 'זכרו שעורכי ויקיפדיה מנסים לשפר אותה ואינם פוגעים באיכותה בכוונה.'],
  ['Active discussions', 'דיונים פעילים'],
  ['View more edits in the recent changes page', 'הצגת עריכות נוספות בדף השינויים האחרונים'],
  ['View more edits in the', 'הצגת עריכות נוספות ב'],
  ['View more edits', 'הצגת עריכות נוספות'],
  ['recent changes page', 'דף השינויים האחרונים'],
  ['View more', 'הצגת עוד'],
  ['Latest comment:', 'התגובה האחרונה:'],
  ['18 minutes ago', 'לפני 18 דקות'],
  ['What should mentorship be?', 'כיצד צריכה להיראות חונכות?'],
  ['Open', 'פתיחה'],
  ['Check best practices to create a free and reliable encyclopedia.', 'עיינו בשיטות המומלצות ליצירת אנציקלופדיה חופשית ואמינה.'],
  ['Review best practices to create a free and reliable encyclopedia.', 'עיינו בשיטות המומלצות ליצירת אנציקלופדיה חופשית ואמינה.'],
  ['This is a prototype made with ProtoWiki.', 'זהו אב־טיפוס שנוצר באמצעות ProtoWiki.'],
  ['Privacy policy', 'מדיניות פרטיות'],
  ['Contact Wikipedia', 'יצירת קשר עם ויקיפדיה'],
  ['Legal & safety contacts', 'יצירת קשר בנושאי משפט ובטיחות'],
  ['Code of Conduct', 'קוד התנהגות'],
  ['Developers', 'מפתחים'],
  ['Statistics', 'סטטיסטיקות'],
  ['Cookie statement', 'הצהרת עוגיות'],
  ['Terms of Use', 'תנאי שימוש'],
  ['Desktop view', 'תצוגת מחשב'],
  ['Mobile view', 'תצוגת נייד'],
  ['About Wikipedia', 'אודות ויקיפדיה'],
  ['Disclaimers', 'הבהרה משפטית'],
  ['Preview changes to', 'תצוגה מקדימה של השינויים ב'],
  ['Preview change', 'תצוגה מקדימה של השינוי'],
  ['We need to get rid of the "suggested links" tool', 'צריך להסיר את הכלי „קישורים מוצעים”'],
  ['Category:Category', 'קטגוריה:קטגוריה'],
  ['Merge PROSPLIT into AfD?', 'האם למזג את PROSPLIT לתוך AfD?'],
  ['Wikipedia:Village pump (proposals)', 'ויקיפדיה:מזנון (הצעות)'],
  ['Wikipedia:Village pump (technical)', 'ויקיפדיה:מזנון (טכני)'],
  ['Wikipedia:Village pump (idea_lab)', 'ויקיפדיה:מזנון (מעבדת רעיונות)'],
  ['22 minutes ago', 'לפני 22 דקות'],
  ['2 hours ago', 'לפני שעתיים'],
  ['Diff preview', 'תצוגה מקדימה של ההבדלים'],
  ['Difference between revisions', 'הבדלים בין גרסאות'],
  ['Revision from:', 'גרסה מתאריך:'],
  ['Revision from ', 'גרסה מתאריך '],
  ['Edit details', 'פרטי העריכה'],
  ['Edit summary:', 'תקציר העריכה:'],
  ['Tags:', 'תגיות:'],
  ['Changed content', 'תוכן שהשתנה'],
  ['50,000,000 edits', '50,000,000 עריכות'],
  ['23 user groups', '23 קבוצות משתמשים'],
  ['About user groups', 'מידע על קבוצות משתמשים'],
  ['About review changes', 'מידע על בדיקת שינויים'],
  ['Suggested changes to review', 'שינויים מוצעים לבדיקה'],
  ['Revision navigation', 'ניווט בין גרסאות'],
  ['Full diff', 'הבדל מלא'],
  ['Thanked', 'נשלחה תודה'],
  ['Thank', 'תודה'],
  ['Undo edit', 'ביטול העריכה'],
  ['Undo', 'ביטול'],
  ['Restore', 'שחזור'],
  ['Reviewed', 'נבדקה'],
  ['Review', 'בדיקה'],
  ['Cancel', 'ביטול'],
  ['Publicly send ‘Thanks’', 'שליחת תודה פומבית'],
  ["Publicly send 'Thanks'", 'שליחת תודה פומבית'],
  ['It is an easy way to show appreciation for an editor’s work on Wikipedia. ‘Thanks’ cannot be undone and are publicly viewable.', 'זוהי דרך פשוטה להביע הערכה לעבודתו של עורך בוויקיפדיה. לא ניתן לבטל תודה והיא גלויה לציבור.'],
  ['This will undo the change(s) shown in this revision. Please provide a reason for undoing the edit(s).', 'פעולה זו תבטל את השינויים המוצגים בגרסה זו. נא לציין סיבה לביטול העריכה.'],
  ['eg. Inaccurate information', 'למשל, מידע לא מדויק'],
  ["A 'Thanks' cannot be undone", 'לא ניתן לבטל תודה'],
  ['Previous review change', 'השינוי הקודם לבדיקה'],
  ['Next review change', 'השינוי הבא לבדיקה'],
  ['Back to dashboard', 'חזרה ללוח הבקרה'],
  ['Back to review changes', 'חזרה לרשימת השינויים'],
  ['Edit marked as reviewed on your dashboard only.', 'העריכה סומנה כנבדקה בלוח הבקרה שלך בלבד.'],
  ['Edit marked as unreviewed on your dashboard only.', 'העריכה סומנה כלא נבדקה בלוח הבקרה שלך בלבד.'],
  ['Edit restored.', 'העריכה שוחזרה.'],
  ['Your edit was saved.', 'העריכה שלך נשמרה.'],
  ['Edit undone', 'העריכה בוטלה'],
  ['Opening Wikipedia', 'פתיחת ויקיפדיה'],
  ['You are leaving the prototype and opening Wikipedia. Any edits or action made there are public', 'אתם עוזבים את אב־הטיפוס ופותחים את ויקיפדיה. כל עריכה או פעולה שתבוצע שם תהיה ציבורית.'],
  ['Got it', 'הבנתי'],
  ['Back to prototype', 'חזרה לאב־הטיפוס'],
  ['Read-only prototype preview. Links, editing, and other actions are unavailable.', 'תצוגת אב־טיפוס לקריאה בלבד. קישורים, עריכה ופעולות אחרות אינם זמינים.'],
  ['Wikipedia editor', 'עורך ויקיפדיה'],
  ['User page sections', 'חלקי דף המשתמש'],
  ['User page', 'דף משתמש'],
  ['Talk', 'שיחה'],
  ['About this user', 'על המשתמש הזה'],
  ['Contributions', 'תרומות'],
  ['This editor contributes to articles and discussions across Wikipedia.', 'עורך זה תורם לערכים ולדיונים ברחבי ויקיפדיה.'],
  ['Search Wikipedia', 'חיפוש בוויקיפדיה'],
  ['Search', 'חיפוש'],
  ['Appearance', 'מראה'],
  ['Notifications', 'התראות'],
  ['Notices', 'הודעות'],
  ['Watchlist', 'רשימת מעקב'],
  ['Prototype user', 'משתמש אב־טיפוס'],
  ['Main menu', 'תפריט ראשי'],
  ['Visit the main page', 'מעבר לעמוד הראשי'],
  ['Site', 'אתר'],
  ['Close diff preview', 'סגירת תצוגת ההבדלים'],
  ['Close', 'סגירה'],
  ['Review actions', 'פעולות בדיקה'],
  ['Diff review actions', 'פעולות לבדיקת ההבדלים'],
  ['Previous change', 'השינוי הקודם'],
  ['Next change', 'השינוי הבא'],
  ['Revert change', 'ביטול השינוי'],
  ['Mark edit as reviewed', 'סימון העריכה כנבדקה'],
  ['Mark edit as unreviewed', 'סימון העריכה כלא נבדקה'],
  ['Open user talk page', 'פתיחת דף השיחה של המשתמש'],
  ['Reason for undoing the edit', 'סיבה לביטול העריכה'],
  ['Loading Wikipedia diff', 'הבדלי ויקיפדיה נטענים'],
  ['Loading Wikipedia visual diff', 'ההבדל החזותי מוויקיפדיה נטען'],
  ['Wikipedia visual diff', 'הבדל חזותי מוויקיפדיה'],
]

function translateText(value: string): string {
  let translated = value
  translated = translated.replace(/^(\s*)(.+) edited the (.+) article(\s*)$/, '$1$2 ערך את הערך $3$4')
  translated = translated.replace(/Publicly send [‘']Thanks[’']/g, 'שליחת תודה פומבית')
  translated = translated.replace(/A [‘']Thanks[’'] cannot be undone\.?/g, 'לא ניתן לבטל תודה.')
  translated = translated.replace(/You thanked (.+)\./g, 'שלחת תודה ל־$1.')
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
        .replace('/template-dashboard-mobile-card/', '/template-dashboard-mobile-card-he/')
        .replace('/template-dashboard-mobile-card$', '/template-dashboard-mobile-card-he')
        .replace('/template-dashboard-mobile-toolbar/', '/template-dashboard-mobile-toolbar-he/')
        .replace('/template-dashboard-mobile-toolbar$', '/template-dashboard-mobile-toolbar-he')
      if (element.href.includes('template-user-page-readonly') || element.href.includes('template-full-diff-readonly')) {
        const url = new URL(element.href)
        url.searchParams.set('lang', 'he')
        element.href = url.toString()
      }
    }
  })
}

export function useHebrewPrototype(): void {
  let observer: MutationObserver | null = null
  onMounted(() => {
    document.documentElement.lang = 'he'
    document.documentElement.dir = 'rtl'
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
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.documentElement.dir = 'ltr'
  })
}
