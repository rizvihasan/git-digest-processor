// index.js

// This is the official toolkit for interacting with GitHub Actions.
const core = require('@actions/core');

async function run() {
  try {
    // Get the 'repo_url' input value that I defined in action.yml.
    const repoUrl = core.getInput('repo_url');

    // Print a message to the action's log.
    core.info(`Starting processing for repository: ${repoUrl}`);

    // TODO: This is where I'll add the main logic:
    // 1. Clone the repository.
    // 2. Walk the file tree.
    // 3. Filter files using .gitignore rules.
    // 4. Generate the digest.
    // 5. Upload the digest as an artifact.

    // For now, I'll just set a dummy output value to make sure it works.
    const artifactName = `digest-for-${Date.now()}`;
    core.setOutput('digest_artifact_name', artifactName);

  } catch (error) {
    // If any part of my script fails, I'll use this to mark the action as 'failed'.
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

// This tells the action to run my 'run' function.
run();