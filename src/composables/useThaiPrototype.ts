import { onBeforeUnmount, onMounted } from 'vue'

const replacements: Array<[string, string]> = [
  ['Hello, NewEditor!', 'สวัสดี NewEditor!'],
  ['Share feedback', 'ส่งความคิดเห็น'],
  ['Preview style', 'รูปแบบตัวอย่าง'],
  ['Review changes', 'ตรวจสอบการแก้ไข'],
  ['These edits were made by other users. Stay up to date and help maintain Wikipedia’s quality by reviewing them.', 'การแก้ไขเหล่านี้ทำโดยผู้ใช้อื่น ติดตามข้อมูลล่าสุดและช่วยรักษาคุณภาพของวิกิพีเดียด้วยการตรวจสอบ'],
  ["These edits were made by other users. Stay up to date and help maintain Wikipedia's quality by reviewing them.", 'การแก้ไขเหล่านี้ทำโดยผู้ใช้อื่น ติดตามข้อมูลล่าสุดและช่วยรักษาคุณภาพของวิกิพีเดียด้วยการตรวจสอบ'],
  ['Your impact', 'ผลงานของคุณ'],
  ['Thanks sent', 'คำขอบคุณที่ส่ง'],
  ['Edits reviewed', 'การแก้ไขที่ตรวจสอบแล้ว'],
  ['Policies and guidelines', 'นโยบายและแนวปฏิบัติ'],
  ['Check what is acceptable and expected on Wikipedia.', 'ตรวจสอบสิ่งที่ยอมรับได้และเป็นสิ่งที่คาดหวังในวิกิพีเดีย'],
  ['Neutral point of view', 'มุมมองที่เป็นกลาง'],
  ['No original research', 'งดงานค้นคว้าต้นฉบับ'],
  ['Verifiability', 'การพิสูจน์ยืนยันได้'],
  ['Assume good faith', 'สันนิษฐานเจตนาดี'],
  ['Content must represent significant views fairly, proportionately, and without bias.', 'เนื้อหาต้องนำเสนอมุมมองที่สำคัญอย่างเป็นธรรม ได้สัดส่วน และปราศจากอคติ'],
  ['Articles should summarise published sources, and not contain users’ own interpretation or knowledge.', 'บทความควรสรุปแหล่งข้อมูลที่เผยแพร่แล้ว และไม่ควรมีการตีความหรือความรู้ส่วนตัวของผู้ใช้'],
  ['New additions should include a citation, providing the source of the information.', 'เนื้อหาที่เพิ่มใหม่ควรมีการอ้างอิงซึ่งระบุแหล่งที่มาของข้อมูล'],
  ['Remember that Wikipedia editors are trying to improve Wikipedia and not deliberately reduce its quality.', 'โปรดจำไว้ว่าผู้แก้ไขวิกิพีเดียพยายามปรับปรุงวิกิพีเดีย ไม่ได้จงใจลดคุณภาพ'],
  ['Active discussions', 'การอภิปรายที่กำลังดำเนินอยู่'],
  ['View more edits', 'ดูการแก้ไขเพิ่มเติม'],
  ['ดูการแก้ไขเพิ่มเติม in the', 'ดูการแก้ไขเพิ่มเติมใน'],
  ['View more', 'ดูเพิ่มเติม'],
  ['Latest comment:', 'ความคิดเห็นล่าสุด:'],
  ['18 minutes ago', '18 นาทีที่แล้ว'],
  ['What should mentorship be?', 'การเป็นพี่เลี้ยงควรเป็นอย่างไร'],
  ['Open', 'เปิด'],
  ['Check best practices to create a free and reliable encyclopedia.', 'ดูแนวปฏิบัติที่ดีในการสร้างสารานุกรมเสรีที่เชื่อถือได้'],
  ['ตรวจสอบ best practices to create a free and reliable encyclopedia.', 'ดูแนวปฏิบัติที่ดีในการสร้างสารานุกรมเสรีที่เชื่อถือได้'],
  ['This is a prototype made with ProtoWiki.', 'นี่คือต้นแบบที่สร้างด้วย ProtoWiki'],
  ['Privacy policy', 'นโยบายความเป็นส่วนตัว'],
  ['Contact Wikipedia', 'ติดต่อวิกิพีเดีย'],
  ['Legal & safety contacts', 'ช่องทางติดต่อด้านกฎหมายและความปลอดภัย'],
  ['Code of Conduct', 'จรรยาบรรณ'],
  ['Developers', 'ผู้พัฒนา'],
  ['Statistics', 'สถิติ'],
  ['Cookie statement', 'คำชี้แจงเกี่ยวกับคุกกี้'],
  ['Terms of Use', 'ข้อกำหนดการใช้งาน'],
  ['Desktop view', 'มุมมองเดสก์ท็อป'],
  ['Mobile view', 'มุมมองมือถือ'],
  ['About Wikipedia', 'เกี่ยวกับวิกิพีเดีย'],
  ['Disclaimers', 'ข้อปฏิเสธความรับผิดชอบ'],
  ['View more edits in the recent changes page', 'ดูการแก้ไขเพิ่มเติมในหน้าปรับปรุงล่าสุด'],
  ['View more edits in the', 'ดูการแก้ไขเพิ่มเติมใน'],
  ['recent changes page', 'หน้าปรับปรุงล่าสุด'],
  ['Preview change', 'ดูตัวอย่างการแก้ไข'],
  ['ดูตัวอย่างการแก้ไขs to', 'ดูตัวอย่างการแก้ไข'],
  ['Search Wikipedia', 'ค้นหาในวิกิพีเดีย'],
  ['Search', 'ค้นหา'],
  ['Appearance', 'การแสดงผล'],
  ['Notifications', 'การแจ้งเตือน'],
  ['Notices', 'ประกาศ'],
  ['Watchlist', 'รายการเฝ้าดู'],
  ['Prototype user', 'ผู้ใช้ต้นแบบ'],
  ['Main menu', 'เมนูหลัก'],
  ['Visit the main page', 'ไปยังหน้าหลัก'],
  ['Close', 'ปิด'],
  ['Close diff preview', 'ปิดตัวอย่างความแตกต่าง'],
  ['ปิด diff preview', 'ปิดตัวอย่างความแตกต่าง'],
  ['Review actions', 'การดำเนินการตรวจสอบ'],
  ['Diff review actions', 'การดำเนินการตรวจสอบความแตกต่าง'],
  ['Previous change', 'การแก้ไขก่อนหน้า'],
  ['Next change', 'การแก้ไขถัดไป'],
  ['Revert change', 'ย้อนการเปลี่ยนแปลง'],
  ['Mark edit as reviewed', 'ทำเครื่องหมายว่าตรวจสอบแล้ว'],
  ['Mark edit as unreviewed', 'ทำเครื่องหมายว่ายังไม่ได้ตรวจสอบ'],
  ['Open user talk page', 'เปิดหน้าอภิปรายของผู้ใช้'],
  ['Reason for undoing the edit', 'เหตุผลในการย้อนการแก้ไข'],
  ['Loading Wikipedia diff', 'กำลังโหลดความแตกต่างจากวิกิพีเดีย'],
  ['Loading Wikipedia visual diff', 'กำลังโหลดความแตกต่างแบบเห็นภาพจากวิกิพีเดีย'],
  ['กำลังโหลดความแตกต่างจากวิกิพีเดีย visual diff', 'กำลังโหลดความแตกต่างแบบเห็นภาพจากวิกิพีเดีย'],
  ['Wikipedia visual diff', 'ความแตกต่างแบบเห็นภาพจากวิกิพีเดีย'],
  ['We need to get rid of the "suggested links" tool', 'เราควรนำเครื่องมือ “ลิงก์ที่แนะนำ” ออก'],
  ['Category:Category', 'หมวดหมู่:หมวดหมู่'],
  ['Merge PROSPLIT into AfD?', 'ควรรวม PROSPLIT เข้ากับ AfD หรือไม่'],
  ['Wikipedia:Village pump (proposals)', 'วิกิพีเดีย:สภากาแฟ (ข้อเสนอ)'],
  ['Wikipedia:Village pump (technical)', 'วิกิพีเดีย:สภากาแฟ (เทคนิค)'],
  ['Wikipedia:Village pump (idea_lab)', 'วิกิพีเดีย:สภากาแฟ (ห้องทดลองแนวคิด)'],
  ['22 minutes ago', '22 นาทีที่แล้ว'],
  ['2 hours ago', '2 ชั่วโมงที่แล้ว'],
  ['Diff preview', 'ตัวอย่างความแตกต่าง'],
  ['Difference between revisions', 'ความแตกต่างระหว่างรุ่น'],
  ['Revision from:', 'รุ่นเมื่อ:'],
  ['Revision from ', 'รุ่นเมื่อ '],
  ['Edit details', 'รายละเอียดการแก้ไข'],
  ['Edit summary:', 'สรุปการแก้ไข:'],
  ['Tags:', 'ป้ายกำกับ:'],
  ['Changed content', 'เนื้อหาที่เปลี่ยนแปลง'],
  ['50,000,000 edits', 'การแก้ไข 50,000,000 ครั้ง'],
  ['23 user groups', 'กลุ่มผู้ใช้ 23 กลุ่ม'],
  ['About user groups', 'เกี่ยวกับกลุ่มผู้ใช้'],
  ['About review changes', 'เกี่ยวกับการตรวจสอบการแก้ไข'],
  ['Suggested changes to review', 'การแก้ไขที่แนะนำให้ตรวจสอบ'],
  ['Revision navigation', 'การนำทางระหว่างรุ่น'],
  ['Full diff', 'ความแตกต่างฉบับเต็ม'],
  ['Thanked', 'ขอบคุณแล้ว'],
  ['Thank', 'ขอบคุณ'],
  ['Undo edit', 'ย้อนการแก้ไข'],
  ['Undo', 'ย้อนกลับ'],
  ['Restore', 'คืนค่า'],
  ['Reviewed', 'ตรวจสอบแล้ว'],
  ['Review', 'ตรวจสอบ'],
  ['Cancel', 'ยกเลิก'],
  ['Publicly send ‘Thanks’', 'ส่งคำขอบคุณแบบสาธารณะ'],
  ["Publicly send 'Thanks'", 'ส่งคำขอบคุณแบบสาธารณะ'],
  ['It is an easy way to show appreciation for an editor’s work on Wikipedia. ‘Thanks’ cannot be undone and are publicly viewable.', 'นี่เป็นวิธีง่าย ๆ ในการแสดงความขอบคุณต่อผลงานของผู้แก้ไขบนวิกิพีเดีย คำขอบคุณไม่สามารถยกเลิกได้และทุกคนมองเห็นได้'],
  ['This will undo the change(s) shown in this revision. Please provide a reason for undoing the edit(s).', 'การดำเนินการนี้จะย้อนการเปลี่ยนแปลงที่แสดงในรุ่นนี้ โปรดระบุเหตุผลในการย้อนการแก้ไข'],
  ['eg. Inaccurate information', 'เช่น ข้อมูลไม่ถูกต้อง'],
  ["A 'Thanks' cannot be undone", 'คำขอบคุณไม่สามารถยกเลิกได้'],
  ['Previous review change', 'การแก้ไขก่อนหน้า'],
  ['Next review change', 'การแก้ไขถัดไป'],
  ['Back to dashboard', 'กลับไปแดชบอร์ด'],
  ['Back to review changes', 'กลับไปยังรายการตรวจสอบ'],
  ['Edit marked as reviewed on your dashboard only.', 'ทำเครื่องหมายว่าตรวจสอบแล้วเฉพาะบนแดชบอร์ดของคุณ'],
  ['Edit marked as unreviewed on your dashboard only.', 'ทำเครื่องหมายว่ายังไม่ได้ตรวจสอบเฉพาะบนแดชบอร์ดของคุณ'],
  ['Edit restored.', 'คืนค่าการแก้ไขแล้ว'],
  ['Your edit was saved.', 'บันทึกการแก้ไขของคุณแล้ว'],
  ['Edit undone', 'ย้อนการแก้ไขแล้ว'],
  ['Opening Wikipedia', 'กำลังเปิดวิกิพีเดีย'],
  ['You are leaving the prototype and opening Wikipedia. Any edits or action made there are public', 'คุณกำลังออกจากต้นแบบและเปิดวิกิพีเดีย การแก้ไขหรือการกระทำใด ๆ ที่ทำบนวิกิพีเดียจะเป็นสาธารณะ'],
  ['Got it', 'เข้าใจแล้ว'],
  ['Back to prototype', 'กลับไปยังต้นแบบ'],
  ['Read-only prototype preview. Links, editing, and other actions are unavailable.', 'ตัวอย่างต้นแบบแบบอ่านอย่างเดียว ลิงก์ การแก้ไข และการดำเนินการอื่น ๆ ไม่พร้อมใช้งาน'],
  ['Wikipedia editor', 'ผู้แก้ไขวิกิพีเดีย'],
  ['User page sections', 'ส่วนต่าง ๆ ของหน้าผู้ใช้'],
  ['User page', 'หน้าผู้ใช้'],
  ['Talk', 'อภิปราย'],
  ['About this user', 'เกี่ยวกับผู้ใช้นี้'],
  ['Contributions', 'เรื่องที่เขียน'],
  ['This editor contributes to articles and discussions across Wikipedia.', 'ผู้แก้ไขคนนี้มีส่วนร่วมในบทความและการอภิปรายทั่ววิกิพีเดีย'],
]

function translateText(value: string): string {
  let translated = value
  translated = translated.replace(/^(\s*)(.+) edited the (.+) article(\s*)$/, '$1$2 แก้ไขบทความ $3$4')
  translated = translated.replace(/Publicly send [‘']Thanks[’']/g, 'ส่งคำขอบคุณแบบสาธารณะ')
  translated = translated.replace(/A [‘']Thanks[’'] cannot be undone\.?/g, 'คำขอบคุณไม่สามารถยกเลิกได้')
  translated = translated.replace(/You thanked (.+)\./g, 'คุณขอบคุณ $1 แล้ว')
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
        .replace('/template-dashboard-mobile-card/', '/template-dashboard-mobile-card-th/')
        .replace('/template-dashboard-mobile-card$', '/template-dashboard-mobile-card-th')
        .replace('/template-dashboard-mobile-toolbar/', '/template-dashboard-mobile-toolbar-th/')
        .replace('/template-dashboard-mobile-toolbar$', '/template-dashboard-mobile-toolbar-th')
      if (element.href.includes('template-user-page-readonly') || element.href.includes('template-full-diff-readonly')) {
        const url = new URL(element.href)
        url.searchParams.set('lang', 'th')
        element.href = url.toString()
      }
    }
  })
}

export function useThaiPrototype(): void {
  let observer: MutationObserver | null = null
  onMounted(() => {
    document.documentElement.lang = 'th'
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
