import raw from '../../../godcomplex.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const name = 'Godcomplex'
const script = createScriptSource('godcomplex.js', raw)

export const godcomplex: ModuleDefinition = {
  slug: 'godcomplex',
  name,
  theme: 'blood',
  tagline:
    'Reinforces powerful characters’ convictions, authority and personal worldview.',
  blurb: 'The most frightening person in the room may be the one who never doubts.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are considered for conversational context.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Maximum estimated size of the guidance added to the scenario.' },
    { key: 'MIN_SCORE', value: readSetting(script, 'MIN_SCORE'), meaning: 'Minimum scene relevance needed to activate; the character card must already establish conviction or authority.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs activation details to the JanitorAI debug console when enabled.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: '[GODCOMPLEX]',
    testMessage:
      'I challenge your authority. I refuse to obey your orders.',
  }),
  completeNote:
    'It activates only when the character card already establishes strong convictions or authority, and never invents powers, motives or actions.',
}
