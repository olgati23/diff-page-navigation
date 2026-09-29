import { germanReviewChanges } from '../germanReviewChanges'
import { thaiReviewChanges } from '../thaiReviewChanges'
import { hebrewReviewChanges } from '../hebrewReviewChanges'

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
  wikiHost?: string
}

const englishReviewChanges: ReviewChange[] = [
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
  {
    title: 'Cactus',
    description: 'Family of mostly succulent plants, adapted to dry environments',
    editor: 'Gnome sort',
    time: '6 minutes ago',
    oldRevisionId: 1376784411,
    revisionId: 1376819227,
    revisionDate: '26 September 2026, 11:45',
    summary: 'punct',
  },
  {
    title: 'Red panda',
    description: 'Species of mammal in Asia',
    editor: 'Phatmatt12188',
    time: '7 minutes ago',
    oldRevisionId: 1369992964,
    revisionId: 1374034403,
    revisionDate: '9 September 2026, 11:58',
    summary: '/* Distribution and habitat */ Fixed list syntax',
  },
  {
    title: 'Bamboo',
    description: 'Subfamily of plants in the grass family',
    editor: 'Acaeton',
    time: '8 minutes ago',
    oldRevisionId: 1376091882,
    revisionId: 1376206789,
    revisionDate: '22 September 2026, 19:15',
    summary:
      '/* Uses */ Updated section by region and removed "{{very long section |date=July 2026}}"',
  },
  {
    title: 'Oak',
    description: 'Tree or shrub in the genus Quercus',
    editor: 'Chiswick Chap',
    time: '9 minutes ago',
    oldRevisionId: 1374587402,
    revisionId: 1374637775,
    revisionDate: '13 September 2026, 06:58',
    summary: 'not only white oak, see the cited text below',
  },
  {
    title: 'Monarch butterfly',
    description: 'Milkweed butterfly in the family Nymphalidae',
    editor: 'OAbot',
    time: '10 minutes ago',
    oldRevisionId: 1376955049,
    revisionId: 1377164427,
    revisionDate: '28 September 2026, 03:53',
    summary:
      '[[Wikipedia:OABOT|Open access bot]]: url-access=subscription updated in citation with #oabot.',
  },
  {
    title: 'Sea otter',
    description: 'Species of marine mammal',
    editor: 'Clayoquot',
    time: '11 minutes ago',
    oldRevisionId: 1377508119,
    revisionId: 1377508571,
    revisionDate: '29 September 2026, 19:35',
    summary:
      '/* Population and distribution */ Refactoring headings and re-ordering sections to put things in geographic sequence rather than political groupings.',
  },
  {
    title: 'Snow leopard',
    description: 'Species of large felid',
    editor: 'Chipmunkdavis',
    time: '12 minutes ago',
    oldRevisionId: 1376862119,
    revisionId: 1376969533,
    revisionDate: '27 September 2026, 04:53',
    summary:
      'Reverted 1 edit by [[Special:Contributions/Quardom|Quardom]] ([[User talk:Quardom|talk]]): Rv, please do not edit with [[WP:LLM]]s. Please be aware of text-source integrity when moving things around.',
  },
  {
    title: 'Red fox',
    description: 'Species of mammal',
    editor: 'Luna the Eurasian Wolf',
    time: '13 minutes ago',
    oldRevisionId: 1376490116,
    revisionId: 1377019085,
    revisionDate: '27 September 2026, 13:37',
    summary: '/* Subspecies */ Tobolsk fox',
  },
  {
    title: 'Lavender',
    description: '',
    editor: '99.73.230.112',
    time: '14 minutes ago',
    oldRevisionId: 664792805,
    revisionId: 1273491424,
    revisionDate: '2 February 2025, 15:30',
    summary: '',
  },
  {
    title: 'Sunflower',
    description: '',
    editor: '~2026-47032-64',
    time: '15 minutes ago',
    oldRevisionId: 1161290280,
    revisionId: 1371930343,
    revisionDate: '29 August 2026, 11:54',
    summary: '',
  },
]

export const reviewChanges: ReviewChange[] = window.location.pathname.includes('-he')
  ? hebrewReviewChanges
  : window.location.pathname.includes('-th')
    ? thaiReviewChanges
    : /-de(?:\/|$)/.test(window.location.pathname)
      ? germanReviewChanges
      : englishReviewChanges
