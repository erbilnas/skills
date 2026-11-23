# Git Commit Message Guidelines

You must format all git commit messages strictly following the Conventional Commits specification. 

## Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

## Allowed Types
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* `ci`: Changes to CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* `chore`: Other changes that don't modify src or test files
* `revert`: Reverts a previous commit

## Strict Constraints
1. **Description (Subject Line):**
   * Keep it short and concise (under 50-72 characters).
   * Use the **imperative, present tense**: "change" not "changed" nor "changes".
   * Do not capitalize the first letter.
   * Do not put a period (`.`) at the end.
2. **Body (Optional):**
   * Use the imperative, present tense.
   * Include the motivation for the change and contrast this with previous behavior.
   * Wrap text at 72 characters.
3. **Scope (Optional):**
   * Keep it short, lowercase, and related to the specific module or package being modified (e.g., `feat(auth): add login route`).

## Examples
* `feat(parser): add ability to parse arrays`
* `fix: prevent race condition in user registration`
* `docs(readme): update installation instructions`
* `chore: update dependency clean-webpack-plugin to v3`
