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
    editor: 'Shaun135',
    time: '1 minute ago',
    oldRevisionId: 1363371441,
    revisionId: 1365397413,
    revisionDate: '22 July 2026, 03:50',
    summary: 'Clarified the description of giant panda predators',
  },
  {
    title: 'Axolotl',
    description: 'Aquatic salamander native to lakes near Mexico City',
    editor: 'Felinaex',
    time: '2 minutes ago',
    oldRevisionId: 1356941966,
    revisionId: 1356942379,
    revisionDate: '30 May 2026, 20:15',
    summary: 'Improved wording about the axolotl as a cultural icon',
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
    editor: 'JaierRT',
    time: '5 minutes ago',
    oldRevisionId: 1338474943,
    revisionId: 1338719751,
    revisionDate: '16 February 2026, 21:04',
    summary: 'Reframed the description of orca attacks on blue whales',
  },
]
