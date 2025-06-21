// index.js

const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execa } = require('execa');
const { globSync } = require('glob');
const ignore = require('ignore');

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

    core.info('Walking the repository to find all files...');
    const allFiles = globSync('**/*', { cwd: tempDir, nodir: true, dot: true });

    core.info(`Found ${allFiles.length} total files. Now applying ignore rules...`);

    const ig = ignore();

    // --- THIS IS THE FIX ---
    // I must add a default rule to ignore the .git directory itself.
    ig.add('.git');

    // Now, check if a .gitignore file exists and add its rules.
    const gitignorePath = path.join(tempDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      ig.add(gitignoreContent);
      core.info('Loaded rules from repository .gitignore file.');
    } else {
      core.info('No .gitignore file found in the repository.');
    }

    const includedFiles = allFiles.filter(file => !ig.ignores(file));

    core.info(`Filtered down to ${includedFiles.length} files.`);
    core.info('--- Sample of files to be included: ---');
    includedFiles.slice(0, 10).forEach(file => core.info(`  - ${file}`));
    core.info('------------------------------------');

    const artifactName = `digest-for-${Date.now()}`;
    core.setOutput('digest_artifact_name', artifactName);

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  } finally {
    if (fs.existsSync(tempDir)) {
      core.info(`Cleaning up temporary directory: ${tempDir}`);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

run();