/**
 * 将 Favour 旧知识点（knowledge.js + components/*.vue）迁移到新系统 API。
 *
 * 用法：
 *   node scripts/migrate-favour-knowledge.mjs
 *   node scripts/migrate-favour-knowledge.mjs --dry-run
 *
 * 环境变量（可选）：
 *   FAVOUR_ROOT   默认 C:\zg\code\Favour\src\views\knowledge
 *   API_BASE      默认 http://localhost:3009/api
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const FAVOUR_ROOT =
  process.env.FAVOUR_ROOT || 'C:\\zg\\code\\Favour\\src\\views\\knowledge';
const API_BASE = (process.env.API_BASE || 'http://localhost:3009/api').replace(/\/$/, '');
const DRY_RUN = process.argv.includes('--dry-run');

const COLORS = ['#722ed1', '#52c41a', '#faad14', '#1890ff', '#eb2f96', '#13c2c2'];

async function api(method, urlPath, body) {
  const res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `${method} ${urlPath} failed (${res.status})`);
  }
  return json.data;
}

function extractTextFromVue(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  [warn] 文件不存在: ${filePath}`);
    return '';
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/const\s+text\s*=\s*ref\s*\(\s*`([\s\S]*?)`\s*\)/);
  return match ? match[1].trim() : '';
}

function vuePathFromUrl(url) {
  const rel = url.replace(/^\.\//, '').replace(/\//g, path.sep);
  return path.join(FAVOUR_ROOT, `${rel}.vue`);
}

async function loadKnowledgeList() {
  const jsPath = path.join(FAVOUR_ROOT, 'knowledge.js');
  const mod = await import(pathToFileURL(jsPath).href);
  return mod.Knowledge_List || [];
}

async function fetchExistingBoard() {
  try {
    return await api('GET', '/knowledge/board');
  } catch {
    return [];
  }
}

async function main() {
  console.log(`Favour 目录: ${FAVOUR_ROOT}`);
  console.log(`API 地址: ${API_BASE}`);
  console.log(DRY_RUN ? '【预览模式，不会写入数据库】\n' : '【开始迁移】\n');

  const knowledgeList = await loadKnowledgeList();
  const existingBoard = DRY_RUN ? [] : await fetchExistingBoard();

  const categoryIdByName = new Map(
    existingBoard.map((col) => [col.name, col.id])
  );
  const existingTitlesByCategory = new Map(
    existingBoard.map((col) => [
      col.name,
      new Set(col.points.map((p) => p.title)),
    ])
  );

  let createdCategories = 0;
  let createdPoints = 0;
  let skippedPoints = 0;

  for (let i = 0; i < knowledgeList.length; i++) {
    const category = knowledgeList[i];
    const color = COLORS[i % COLORS.length];

    let categoryId = categoryIdByName.get(category.name);
    if (!categoryId) {
      const payload = {
        name: category.name,
        description: null,
        color,
        sort_order: i,
        status: 1,
      };
      if (DRY_RUN) {
        categoryId = `new-${category.id}`;
        console.log(`[分类] 将创建: ${category.name}`);
      } else {
        const created = await api('POST', '/knowledge/categories', payload);
        categoryId = created.id;
        categoryIdByName.set(category.name, categoryId);
        existingTitlesByCategory.set(category.name, new Set());
        console.log(`[分类] 已创建: ${category.name} (id=${categoryId})`);
      }
      createdCategories++;
    } else {
      console.log(`[分类] 已存在，跳过: ${category.name} (id=${categoryId})`);
    }

    const titleSet = existingTitlesByCategory.get(category.name) || new Set();

    for (let j = 0; j < (category.children || []).length; j++) {
      const item = category.children[j];
      const title = (item.name || '').trim();
      if (!title) {
        console.warn(`  [跳过] 空标题: ${item.url}`);
        skippedPoints++;
        continue;
      }

      if (titleSet.has(title)) {
        console.log(`  [跳过] 已存在: ${title}`);
        skippedPoints++;
        continue;
      }

      const vueFile = vuePathFromUrl(item.url);
      const content = extractTextFromVue(vueFile);
      const payload = {
        category_id: categoryId,
        title,
        summary: item.description?.trim() || null,
        content: content || null,
        tags: category.name,
        sort_order: j,
        status: 1,
      };

      if (DRY_RUN) {
        console.log(`  [知识点] 将创建: ${title} (${content.length} 字符)`);
      } else {
        await api('POST', '/knowledge/points', payload);
        titleSet.add(title);
        console.log(`  [知识点] 已创建: ${title}`);
      }
      createdPoints++;
    }
  }

  console.log('\n--- 完成 ---');
  console.log(`分类: ${createdCategories} 个新建`);
  console.log(`知识点: ${createdPoints} 个${DRY_RUN ? '待导入' : '已导入'}`);
  console.log(`跳过: ${skippedPoints} 个`);
}

main().catch((err) => {
  console.error('\n迁移失败:', err.message);
  process.exit(1);
});
