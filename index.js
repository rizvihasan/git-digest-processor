// index.js

const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execa } = require('execa');

async function run() {
  // I'll create a temporary directory for each run, to keep things clean.
  const tempDir = path.join(process.cwd(), `temp-${Date.now()}`);

  try {
    const repoUrl = core.getInput('repo_url');
    core.info(`Starting processing for repository: ${repoUrl}`);

    // Creating the temporary directory where I'll clone the repo.
    core.info(`Creating temporary directory: ${tempDir}`);
    fs.mkdirSync(tempDir);

    // --- This is the core logic for cloning ---
    core.info(`Cloning repository into temporary directory...`);

    // I'm using '--depth 1' for a shallow clone.
    // This is much faster as it doesn't download the entire git history.
    await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);

    core.info('Repository cloned successfully.');

    // TODO: Next step is to walk this directory and process the files.
    // I can now access the cloned files inside the 'tempDir'.

    const artifactName = `digest-for-${Date.now()}`;
    core.setOutput('digest_artifact_name', artifactName);

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  } finally {
    // This 'finally' block ensures my temporary directory is always cleaned up,
    // even if the action fails.
    if (fs.existsSync(tempDir)) {
      core.info(`Cleaning up temporary directory: ${tempDir}`);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

run();