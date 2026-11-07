import fs from 'fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

async function pushToGitHub() {
  const dir = process.cwd();
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  const repoUrl = process.argv[3] || 'https://github.com/dkhili97/SmartBudget-1.2.git';

  if (!token) {
    console.log('Usage: node scripts/push-to-github.js <GITHUB_TOKEN>');
    console.log('Or set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }

  console.log(`Pushing code to ${repoUrl}...`);

  // Ensure branch is main
  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {
    // Branch may already exist
  }

  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    url: repoUrl,
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token }),
  });

  console.log('Push completed successfully!', pushResult);
}

pushToGitHub().catch((err) => {
  console.error('Push failed:', err.message || err);
});
