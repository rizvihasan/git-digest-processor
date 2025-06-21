// index.js

const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execa } = require('execa');
const { globSync } = require('glob');
const ignore = require('ignore');
const artifact = require('@actions/artifact'); // I'm importing the artifact client.

async function run() {
  const tempDir = path.join(process.cwd(), `temp-${Date.now()}`);

  try {
    // --- Setup and Cloning (No changes here) ---
    const repoUrl = core.getInput('repo_url');
    core.info(`Starting processing for repository: ${repoUrl}`);
    fs.mkdirSync(tempDir, { recursive: true });
    core.info(`Cloning repository into temporary directory...`);
    await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);
    core.info('Repository cloned successfully.');

    // --- File Discovery and Filtering (No changes here) ---
    core.info('Walking the repository to find all files...');
    const allFiles = globSync('**/*', { cwd: tempDir, nodir: true, dot: true });
    const ig = ignore().add('.git');
    const gitignorePath = path.join(tempDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      ig.add(fs.readFileSync(gitignorePath, 'utf8'));
    }
    const includedFiles = allFiles.filter(file => !ig.ignores(file));
    core.info(`Found ${allFiles.length} total files. Filtered down to ${includedFiles.length} files.`);

    // --- FINAL STEP: Read files and build the digest ---
    core.info('Reading file contents and generating digest...');
    let finalDigest = `Repository: ${repoUrl}\n`;
    finalDigest += `Total files processed: ${includedFiles.length}\n\n`;

    for (const file of includedFiles) {
      const filePath = path.join(tempDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        finalDigest += `---\nFile: ${file}\n---\n${content}\n\n`;
      } catch (err) {
        // This likely means the file is binary, so I'll just note its path.
        finalDigest += `---\nFile: ${file} (binary or unreadable)\n---\n\n`;
      }
    }

    // --- Upload the final digest as a workflow artifact ---
    const digestPath = path.join(tempDir, 'digest.txt');
    fs.writeFileSync(digestPath, finalDigest);

    const artifactClient = artifact.create();
    const artifactName = 'code-digest';
    const filesToUpload = [digestPath];
    const rootDirectory = tempDir;

    core.info(`Uploading digest artifact: ${artifactName}`);
    await artifactClient.uploadArtifact(artifactName, filesToUpload, rootDirectory);
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