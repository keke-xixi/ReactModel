/**
 * 打包前端 dist + 后端源码（不含 node_modules），输出到 release/
 * 用法: node scripts/pack-release.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reactRoot = path.resolve(__dirname, '..');
const backRoot = path.resolve(reactRoot, '../test/reactBack');
const outRoot = path.join(reactRoot, 'release');
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const backCopyDirs = ['routes', 'db', 'middleware', 'uploads', 'scripts'];
const backCopyFiles = ['server.js', 'package.json', 'package-lock.json', '.env.example'];

function rim(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyBackend() {
  const dest = path.join(outRoot, 'reactBack');
  rim(dest);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of backCopyFiles) {
    const src = path.join(backRoot, f);
    if (fs.existsSync(src)) cp(src, path.join(dest, f));
  }
  for (const d of backCopyDirs) {
    const src = path.join(backRoot, d);
    if (fs.existsSync(src)) cp(src, path.join(dest, d));
  }
  if (!fs.existsSync(path.join(dest, 'uploads'))) {
    fs.mkdirSync(path.join(dest, 'uploads'), { recursive: true });
  }
}

console.log('[1/3] 构建前端…');
execSync('npm run build', { cwd: reactRoot, stdio: 'inherit' });

console.log('[2/3] 复制产物…');
rim(outRoot);
fs.mkdirSync(outRoot, { recursive: true });
cp(path.join(reactRoot, 'dist'), path.join(outRoot, 'dist'));
copyBackend();
fs.copyFileSync(
  path.join(reactRoot, 'deploy', 'nginx-zfree.conf'),
  path.join(outRoot, 'nginx-zfree.conf')
);
fs.copyFileSync(path.join(reactRoot, 'deploy', 'DEPLOY.md'), path.join(outRoot, 'DEPLOY.md'));

console.log('[3/3] 完成');
console.log(`输出目录: ${outRoot}`);
console.log('上传 release/dist 与 release/reactBack 到服务器后，按 DEPLOY.md 部署。');
