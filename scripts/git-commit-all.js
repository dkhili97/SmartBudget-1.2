import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';

async function stageAllFiles(dir, currentRel = '') {
  const currentPath = path.join(dir, currentRel);
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.gradle' || entry.name === 'build') {
      continue;
    }
    if (entry.isDirectory()) {
      await stageAllFiles(dir, relPath);
    } else {
      try {
        await git.add({ fs, dir, filepath: relPath });
      } catch (err) {
        // Ignored files (like local.properties) will be skipped safely
      }
    }
  }
}

async function run() {
  const dir = process.cwd();
  console.log('Staging files in:', dir);
  await stageAllFiles(dir);

  const commitMsg = process.argv[2] || 'feat: SmartBudget v1.6.0 - clean 5-tab UX, minimalist splash, onboarding guide & automatic update modal';
  console.log('Committing with message:', commitMsg);

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Karim Dkhili',
      email: 'dkhili97@gmail.com',
    },
    message: commitMsg,
  });

  console.log('Successfully committed SHA:', sha);
}

run().catch((err) => {
  console.error('Commit failed:', err);
  process.exit(1);
});
