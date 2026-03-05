import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, '../..');

export function repoPath(...segments) {
  return path.resolve(repoRoot, ...segments);
}

export function normalizePath(p) {
  return p.split(path.sep).join('/');
}

export const paths = Object.freeze({
  appDir: repoPath('apps', 'h5-main'),
  appIndex: repoPath('apps', 'h5-main', 'index.html'),
  appAssetsDir: repoPath('apps', 'h5-main', 'assets'),
  appScriptFile: repoPath('apps', 'h5-main', 'assets', 'js', 'app.js'),
  auditConfigFile: repoPath('config', 'landing-audit.config.json'),
  artifactsLandingsDir: repoPath('artifacts', 'landings'),
  artifactsAuditsDir: repoPath('artifacts', 'audits'),
  artifactsAuditRunsDir: repoPath('artifacts', 'audits', 'runs'),
  compareLabDir: repoPath('experiments', 'landing-compare-lab'),
  compareLabAuditsDir: repoPath('experiments', 'landing-compare-lab', 'analysis', 'audits'),
  jimengLoginDir: repoPath('apps', 'h5-main', 'assets', 'login'),
  jimengStorageStateFile: repoPath('apps', 'h5-main', 'assets', 'login', 'jimeng-storage-state.json'),
  jimengVideoDir: repoPath('apps', 'h5-main', 'assets', 'video')
});
