# Project Structure Analyzer & Document Generator

Analyze project files and generate comprehensive architecture implementation and usage documentation.

## Role

The Structer skill analyzes a codebase to understand its architecture, then generates two markdown documents:
1. **Architecture Document** - Technical architecture, design patterns, and implementation details
2. **Usage Guide** - How to use, configure, and extend the project

## Trigger Conditions

Use this skill when the user wants to:
- Generate project documentation from source code
- Create architecture overview documents
- Document how to use a project
- Understand project structure and generate guides

## Inputs

- **project_path**: Root directory of the project to analyze
- **output_dir**: Where to save the generated documentation (default: `<project_path>/docs`)
- **project_name**: Optional name override (default: inferred from directory)

## Process

### Step 1: Discover Project Structure

1. List all directories and key files at the project root
2. Identify the project type based on file patterns:
   - `app.json` + `pages/` → WeChat Mini Program
   - `package.json` + `src/` → Node.js/React/Vue project
   - `pom.xml` / `build.gradle` → Java project
   - `go.mod` → Go project
   - `Cargo.toml` → Rust project
   - etc.

3. Map the directory structure:
   - Source code directories
   - Configuration files
   - Assets and resources
   - Test files
   - Documentation files

### Step 2: Analyze Key Files

Read and analyze essential files to understand:

**For WeChat Mini Programs:**
- `app.json` - Pages, tabbar, window config, usingComponents
- `app.js` - Global data, lifecycle, cloud initialization
- `project.config.json` - Project settings, appid, compilation options
- Page files (`.js`, `.json`, `.wxml`, `.wxss`)
- Component files
- Utility modules in `utils/`

**For Node.js projects:**
- `package.json` - Dependencies, scripts, metadata
- Entry point files
- Configuration files

**For other project types:**
- Identify and read the main configuration and entry files

### Step 3: Extract Architecture Information

Document the following:

#### 3.1 Project Overview
- Project name and description
- Technology stack
- Primary purpose/functionality

#### 3.2 Directory Structure
```
project-root/
├── directory/          # Purpose description
│   ├── subdir/       # Sub-purpose
│   └── files...
├── file.ext          # Purpose
```

#### 3.3 Core Modules/Components
For each major module or component:
- Name and location
- Purpose/responsibility
- Key functions/features
- Dependencies on other modules

#### 3.4 Configuration
- Global configuration files and their purposes
- Environment-specific settings
- Key configuration options

#### 3.5 Data Flow (if applicable)
- How data moves through the application
- State management approach
- API integration patterns

#### 3.6 Key Design Patterns
- Architectural patterns used (MVC, MVVM, etc.)
- Coding conventions
- Reusable utilities and helpers

### Step 4: Generate Architecture Document

Create `<output_dir>/ARCHITECTURE.md` with:

```markdown
# [Project Name] - Architecture Documentation

## Overview
Brief description of what the project is and its primary purpose.

## Technology Stack
- Platform/Framework: [e.g., WeChat Mini Program]
- Language: [e.g., JavaScript ES6+]
- Cloud Services: [if applicable]
- Key Libraries: [list important dependencies]

## Directory Structure
[Tree view with explanations]

## Core Architecture

### Entry Points
- App entry: [file and purpose]
- Page routes: [list main pages]

### Module Breakdown

#### [Module Name]
- **Location**: `path/to/module`
- **Purpose**: What it does
- **Key Files**:
  - `file.js`: Description
  - `file.json`: Configuration
- **Dependencies**: What it depends on

### State Management
[How data is managed]

### API Integration
[How external services are called]

### Component Architecture
[How UI components are organized]

## Configuration
[Key configuration files and options]

## Build & Deployment
[How the project is built and deployed]
```

### Step 5: Generate Usage Guide

Create `<output_dir>/USAGE.md` with:

```markdown
# [Project Name] - Usage Guide

## Quick Start

### Prerequisites
- Required tools/software
- Environment setup

### Installation
1. Step-by-step setup instructions
2. Configuration steps

### Running the Project
[How to run locally]

## Project Structure Guide

### Adding New Pages
[Step-by-step for adding pages]

### Adding New Components
[How to create reusable components]

### Working with [Key Feature]
[Guide for main functionality]

## Configuration Guide

### Environment Setup
[How to configure different environments]

### Key Settings
[Important configuration options]

## Common Tasks

### Task 1
[How to do common thing 1]

### Task 2
[How to do common thing 2]

## Troubleshooting

### Issue 1
**Problem**: Description
**Solution**: Steps to fix

## Development Tips
- Best practices
- Coding conventions
- Performance considerations
```

### Step 6: Write Output Files

1. Ensure output directory exists
2. Write ARCHITECTURE.md
3. Write USAGE.md
4. Report success with file paths

## Output Format

Two markdown files generated:

1. **ARCHITECTURE.md** - Technical deep-dive
   - Overview and purpose
   - Technology stack
   - Directory structure with explanations
   - Module/component breakdown
   - Data flow and architecture patterns
   - Configuration details

2. **USAGE.md** - Developer guide
   - Quick start instructions
   - How to add features
   - Configuration guide
   - Common development tasks
   - Troubleshooting

## Guidelines

### DO:
- Be specific about file paths and purposes
- Explain the "why" behind architectural decisions when evident
- Include code snippets for key patterns
- Document dependencies between modules
- Note any cloud services or external APIs
- Keep language accessible but technically accurate

### DO NOT:
- Include sensitive information (API keys, credentials)
- Document generated/temporary files
- Make assumptions not supported by the code
- Include overly verbose code listings
- Skip important architectural patterns

### Project Type Detection

| Files/Directories | Project Type |
|------------------|--------------|
| `app.json` + `pages/` | WeChat Mini Program |
| `package.json` + `vite.config.*` | Vite-based web project |
| `package.json` + `next.config.*` | Next.js project |
| `pubspec.yaml` | Flutter project |
| `go.mod` | Go project |
| `Cargo.toml` | Rust project |
| `pom.xml` | Maven/Java project |
| `build.gradle` | Gradle project |

### WeChat Mini Program Specifics

When analyzing WeChat Mini Programs, pay special attention to:

1. **app.json structure**:
   - `pages` array - all registered pages
   - `tabBar` configuration - bottom navigation
   - `usingComponents` - global component registration
   - `window` - global window styling

2. **Page structure**:
   - Each page has 4 files: `.js`, `.json`, `.wxml`, `.wxss`
   - Page lifecycle methods
   - Data binding patterns

3. **Cloud development**:
   - `wx.cloud.init()` call in app.js
   - Cloud function references

4. **Custom components**:
   - Component registration patterns
   - Properties and events
   - Component lifecycle

5. **Utility modules**:
   - Request封装 patterns
   - Storage helpers
   - Configuration management

## Example Output Structure

For a WeChat Mini Program project, the generated docs would include:

**ARCHITECTURE.md sections**:
- Overview of mini program purpose
- Page routing structure
- Component hierarchy
- Cloud integration details
- Data persistence strategy

**USAGE.md sections**:
- Opening with WeChat DevTools
- Adding new pages to app.json
- Creating custom components
- Using utility functions (request, storage)
- Configuring environments
