// index.js

const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execa } = require('execa');
const { globSync } = require('glob');
const ignore = require('ignore');
// I am importing the specific Client class from the library.
const { DefaultArtifactClient } = require('@actions/artifact');

async function run() {
  const tempDir = path.join(process.cwd(), `temp-${Date.now()}`);

  try {
    const repoUrl = core.getInput('repo_url');
    core.info(`Starting processing for repository: ${repoUrl}`);
    fs.mkdirSync(tempDir, { recursive: true });
    core.info(`Cloning repository into temporary directory...`);
    await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);
    core.info('Repository cloned successfully.');

    core.info('Walking the repository to find all files...');
    const allFiles = globSync('**/*', { cwd: tempDir, nodir: true, dot: true });
    const ig = ignore().add('.git');
    const gitignorePath = path.join(tempDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      ig.add(fs.readFileSync(gitignorePath, 'utf8'));
    }
    const includedFiles = allFiles.filter(file => !ig.ignores(file));
    core.info(`Filtered down to ${includedFiles.length} files.`);

    core.info('Reading file contents and generating digest...');
    let finalDigest = `Repository: ${repoUrl}\n`;
    finalDigest += `Total files processed: ${includedFiles.length}\n\n`;

    for (const file of includedFiles) {
      const filePath = path.join(tempDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        finalDigest += `---\nFile: ${file}\n---\n${content}\n\n`;
      } catch (err) {
        finalDigest += `---\nFile: ${file} (binary or unreadable)\n---\n\n`;
      }
    }

    const digestPath = path.join(tempDir, 'digest.txt');
    fs.writeFileSync(digestPath, finalDigest);

    // --- THIS IS THE FIX ---
    // 1. I create a new instance of the artifact client.
    const artifactClient = new DefaultArtifactClient();
    const artifactName = 'code-digest';
    const filesToUpload = [digestPath];
    const rootDirectory = tempDir;
    const options = {
        continueOnError: false
    };

    core.info(`Uploading digest artifact: ${artifactName}`);
    // 2. I call the 'uploadArtifact' method on the client instance.
    await artifactClient.uploadArtifact(artifactName, filesToUpload, rootDirectory, options);
    core.info('Artifact uploaded successfully.');

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