export interface ReviewChange {
  title: string
  description: string
  editor: string
  time: string
  oldRevisionId: number
  revisionId: number
  revisionDate: string
  summary: string
  tags?: string[]
}

export const reviewChanges: ReviewChange[] = [
  {
    title: 'Giant panda',
    description: 'Bear species native to south central China',
    editor: 'LeandroPucha',
    time: '1 minute ago',
    oldRevisionId: 1321031198,
    revisionId: 1322193759,
    revisionDate: '14 November 2025, 21:51',
    summary: 'Added information about the bite force of giant pandas',
  },
  {
    title: 'Axolotl',
    description: 'Aquatic salamander native to lakes near Mexico City',
    editor: 'ARoseThorn',
    time: '2 minutes ago',
    oldRevisionId: 1356709509,
    revisionId: 1356738410,
    revisionDate: '29 May 2026, 14:59',
    summary: 'Expanded the article with information about axolotls in human care',
  },
  {
    title: 'Tiger',
    description: 'Largest living cat species, native to Asia',
    editor: 'BhagyaMani',
    time: '3 minutes ago',
    oldRevisionId: 1367202289,
    revisionId: 1367220244,
    revisionDate: '1 August 2026, 20:06',
    summary: 'Shortened and clarified the description of tiger anatomy',
  },
  {
    title: 'Orchid',
    description: 'Diverse family of flowering plants',
    editor: 'Chiswick Chap',
    time: '4 minutes ago',
    oldRevisionId: 1307714448,
    revisionId: 1307742282,
    revisionDate: '25 August 2025, 12:34',
    summary: 'Clarified the variation in orchid flower forms',
  },
  {
    title: 'Blue whale',
    description: 'Marine mammal and the largest animal known to have existed',
    editor: 'Oxymetheus',
    time: '5 minutes ago',
    oldRevisionId: 1331474466,
    revisionId: 1331917300,
    revisionDate: '8 January 2026, 22:25',
    summary: 'Clarified a paragraph about an early blue whale fetus',
  },
]
