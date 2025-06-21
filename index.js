// index.js

const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execa } = require('execa');
const { globSync } = require('glob'); // I'm importing the 'globSync' function.

async function run() {
  const tempDir = path.join(process.cwd(), `temp-${Date.now()}`);

  try {
    const repoUrl = core.getInput('repo_url');
    core.info(`Starting processing for repository: ${repoUrl}`);
    core.info(`Creating temporary directory: ${tempDir}`);
    fs.mkdirSync(tempDir);

    core.info(`Cloning repository into temporary directory...`);
    await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);
    core.info('Repository cloned successfully.');

    // --- This is the new logic for listing files ---
    core.info('Walking the repository to find all files...');

    // The pattern '**/*' means all files in all subdirectories.
    // 'cwd' tells glob to start searching from my tempDir.
    // 'nodir' means I only want files, not directory names.
    // 'dot' means I also want to find hidden dotfiles.
    const fileList = globSync('**/*', { cwd: tempDir, nodir: true, dot: true });

    core.info(`Found ${fileList.length} files.`);
    // For debugging, I'll print the first 10 files found.
    core.info('--- Sample of files found: ---');
    fileList.slice(0, 10).forEach(file => core.info(`  - ${file}`));
    core.info('-----------------------------');


    // TODO: Next, I need to filter this list using .gitignore rules.

    const artifactName = `digest-for-${Date.now()}`;
    core.setOutput('digest_artifact_name', artifactName);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  } finally {
    if (fs.existsSync(tempDir)) {
      core.info(`Cleaning up temporary directory: ${tempDir}`);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }}

run();