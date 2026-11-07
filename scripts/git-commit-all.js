import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';

async function initAndCommit() {
  const dir = process.cwd();
  console.log('Project directory:', dir);

  // 1. Initialize git repo if not exists
  const gitDir = path.join(dir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('Initializing git repository...');
    await git.init({ fs, dir });
  } else {
    console.log('Git repo already initialized.');
  }

  // 2. Add all files tracked by git
  console.log('Scanning and staging files...');
  await git.add({
    fs,
    dir,
    filepath: '.',
  });

  // 3. Commit
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Karim Dkhili',
      email: 'dkhili97@gmail.com',
    },
    message: 'feat: SmartBudget v1.5.1 with animated splash screen, logo and offline advisor',
  });

  console.log('Commit created successfully! SHA:', sha);
}

initAndCommit().catch((err) => {
  console.error('Git error:', err);
});

