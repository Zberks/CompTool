# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## Project status: early scaffold

**CompTool is currently a near-empty repository.** As of this writing it contains
only:

- `README.md` — a placeholder with just the project title.
- `first.txt` — a placeholder file containing the text `hello`.
- `.gitignore` — a standard Java ignore template (see "Intended stack" below).

There is **no source code, build system, dependency manifest, or test suite yet.**
Do not assume a framework, language runtime, or directory layout exists — none has
been committed. When asked to "build" or "run" the project, first confirm what the
user wants to create, because there is nothing to build at the moment.

> Keep this file honest. As real code lands, **update the sections below** to
> reflect the actual structure, commands, and conventions instead of the
> placeholders described here.

## Intended stack

The committed `.gitignore` targets **Java** (ignores `*.class`, `*.jar`, `*.war`,
`*.ear`, `*.nar`, BlueJ `*.ctxt` files, J2ME artifacts, and JVM `hs_err_pid*`
crash logs). It also ignores `.vscode/`. This is the only signal in the repo about
the intended technology, so absent other direction, treat Java as the default
language for new code.

No build tool (Maven `pom.xml`, Gradle `build.gradle`, etc.) is present yet. If you
introduce one, document the build/test/run commands here.

## Repository layout

```
CompTool/
├── .gitignore     # Java ignore template
├── README.md      # Project title placeholder
└── first.txt      # Placeholder file
```

There are no `src/`, `test/`, or module directories yet.

## Development workflow

### Branching

- All work for the current task goes on the branch **`claude/claude-md-docs-Hetim`**.
- Create feature branches off `main`; do not commit directly to `main`.
- Never force-push or push to a branch other than the one you were assigned without
  explicit permission.

### Commits

- Write clear, descriptive, imperative commit messages
  (e.g. "Add CLAUDE.md", not "added stuff").
- Commit logically related changes together.

### Pushing

- Push with `git push -u origin <branch-name>`.
- On network failures, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

### Pull requests

- **Do not open a pull request unless the user explicitly asks for one.**

## Conventions for AI assistants

- **Don't invent structure.** This is a blank-slate repo; describe and build only
  what's actually here or what the user explicitly requests.
- **Match the intended stack.** Default new code to Java unless told otherwise, and
  keep generated artifacts (`*.class`, `*.jar`, etc.) out of version control — the
  `.gitignore` already covers them.
- **Update this file** whenever you add a build system, source tree, or test suite,
  so future sessions have accurate guidance.
- Prefer small, reviewable changes and explain non-obvious decisions in commit
  messages or the PR description.

## Common commands

No project-specific build, test, or run commands exist yet. Once a build tool is
added, replace this section with the real commands, for example:

```
# (placeholder — fill in once a build system exists)
# Build:  mvn package      or   ./gradlew build
# Test:   mvn test         or   ./gradlew test
# Run:    java -jar target/comptool.jar
```
