import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const windows = process.platform === 'win32'
function run(command, args, cwd) {
  console.log(`\nRunning ${command} ${args.join(' ')}`)
  // Windows .cmd files require cmd.exe; every argument here is a fixed literal.
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: windows,
  })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status || 1)
}
const frontend = path.join(root, 'frontend')
const backend = path.join(root, 'backend')
const npm = windows ? 'npm.cmd' : 'npm'
const mvn = windows ? '.\\mvnw.cmd' : './mvnw'
run(npm, ['ci', '--no-audit', '--no-fund'], frontend)
run(npm, ['test'], frontend)
run(npm, ['run', 'build'], frontend)
run(mvn, ['-B', '-ntp', '-Pbundle-frontend', 'clean', 'verify'], backend)
const jar = path.join(backend, 'target', 'internship-radar-0.0.1-SNAPSHOT.jar')
if (!existsSync(jar))
  throw new Error('Backend build did not produce the expected jar')
mkdirSync(path.join(root, 'dist'), { recursive: true })
copyFileSync(jar, path.join(root, 'dist', 'internship-radar.jar'))
console.log('\nRelease ready: dist/internship-radar.jar (includes frontend).')
