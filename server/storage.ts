import fs from 'node:fs/promises'
import path from 'node:path'

import type { StoredGeneration } from '../shared/game'

const RUNS_DIR = path.resolve(process.cwd(), '.gameclaw', 'runs')

export async function persistRun(run: StoredGeneration): Promise<void> {
  await fs.mkdir(RUNS_DIR, { recursive: true })
  await fs.writeFile(
    path.join(RUNS_DIR, `${run.blueprint.slug}-${run.blueprint.id}.json`),
    JSON.stringify(run, null, 2),
    'utf8',
  )
}
