---
description: Process and publish documents from ./tmp/ to the notes site
---

You are tasked with processing raw documentation from the `./tmp/` directory and publishing it to this bilingual notes site.

## Workflow

1. **Scan for documents and determine processing mode**
   - Check `./tmp/` directory for markdown files (\*.md)
   - Exclude files ending with `:Zone.Identifier`
   - Classify documents as:
     - **Unprocessed**: No `-YYYYMMDD` timestamp AND no similar document found in `./src/content/docs/` root directory
     - **Processed**: Has `-YYYYMMDD` timestamp OR similar document exists in `./src/content/docs/` root

   - **If unprocessed documents found:**
     - Prioritize processing new documents
     - If multiple unprocessed documents exist, list them with numbered options and ask user to select one
     - Process exactly ONE document per task

   - **If all documents are processed:**
     - List all processed documents with numbered options
     - Ask user: "All documents have been processed. Would you like to reprocess any? Please select a number:"
     - If user confirms reprocessing: overwrite existing EN/ZH files and update `lastUpdated` field to current date

   - **Document similarity check:**
     - Don't rely only on exact filename matches
     - Check for similar content or related filenames (e.g., `wsl-chrome-setup.md` might match `chrome-devtools-setup.md`)
     - When in doubt, read the first few lines of both documents to compare content

2. **Review and sanitize** (CRITICAL)
   - Review the document for any sensitive information
   - Remove or redact:
     - Personal email addresses (replace with generic examples like `user@example.com`)
     - Specific usernames or account names (use placeholders like `username`)
     - Private repository URLs (generalize to `username/repo`)
     - SSH key fingerprints or signatures (use `xxx` or generic examples)
     - File paths that reveal personal information
     - Any credentials, tokens, or secrets
   - Ensure all content is appropriate for public access

3. **Optimize for Starlight**
   - Remove the Table of Contents section (Starlight auto-generates TOC)
   - Ensure proper markdown formatting
   - Verify code blocks have language tags
   - Keep technical accuracy and completeness

4. **Generate frontmatter**
   - `title`: Clear, concise article title
   - `description`: Brief 1-2 sentence description (under 160 chars ideal for SEO)
   - `lastUpdated`:
     - For new documents: Use the date from original frontmatter, or current date if missing
     - For reprocessed documents: Always use current date
   - `tags`: Array of relevant lowercase tags (e.g., ssh, bash, git, devops)
     - Use existing tags if present
     - Keep tags in English (technical terms)
     - 3-7 tags recommended

5. **Create English version**
   - Save to `src/content/docs/<filename>.md` (root directory, not en/ folder)
   - Use a descriptive, URL-friendly filename (lowercase, hyphens for spaces)
   - Ensure proper frontmatter format

6. **Create Chinese translation**
   - Translate all content to Chinese
   - Keep tags identical to English version (do NOT translate tags)
   - Keep code blocks, commands, and technical terms unchanged
   - Save to `src/content/docs/zh/<filename>.md`
   - Use the same filename as English version

7. **Update sidebar configuration**
   - Edit `astro.config.mjs`
   - Add new entry to `sidebar` array with this format:

   ```js
   {
     label: 'English Article Title',
     translations: {
       'zh-CN': '中文文章标题',
     },
     link: '/filename/'
   }
   ```

   - Maintain flat structure (no nested groups)
   - Add new articles at the end of the sidebar array

8. **Rename source document**
   - Rename the original document in `./tmp/` to match the published filename
   - Append processing timestamp to the filename: `<filename>-YYYYMMDD.md`
   - Example: `./tmp/fixing-ssh-agent-20251008.md`
   - If reprocessing an existing document with old timestamp, replace with new timestamp
   - This helps identify already-processed documents by both name match and timestamp presence

9. **Run quality checks and auto-fix**
   - Run `npm run fix` to automatically fix formatting issues
   - Run `npm run check` to verify all quality checks pass
   - If any errors remain:
     - Analyze the error messages carefully
     - Attempt to fix the issues manually (e.g., adjust markdown syntax, fix frontmatter format)
     - Re-run `npm run check` to verify fixes
     - Only if unable to determine how to fix, ask the user for guidance
     - Never leave unfixed errors without attempting resolution

10. **Verification**
    - Confirm both EN and ZH versions are created
    - Confirm sidebar is updated (for new documents)
    - Confirm source document renamed with timestamp
    - Confirm quality checks passed
    - List the created files for user review

## Output Format

After processing, provide a summary:

- ✅ Document sanitized and reviewed
- ✅ English version created: `src/content/docs/<filename>.md`
- ✅ Chinese version created: `src/content/docs/zh/<filename>.md`
- ✅ Sidebar updated in `astro.config.mjs` (for new documents)
- ✅ Source document renamed: `./tmp/<filename>-YYYYMMDD.md`
- ✅ Auto-fixed formatting issues: `npm run fix`
- ✅ Quality checks passed: `npm run check`
- 📝 Tags: [list of tags]

## Important Notes

- ALWAYS review for sensitive information before publishing
- Tags must remain in English in both language versions
- Use the same filename for both EN and ZH versions
- Maintain consistent frontmatter structure
- Keep technical accuracy in translations

## Complete Workflows

### Workflow A: Processing a New Document

1. Scan `./tmp/` for unprocessed markdown files (no timestamp AND not in `./src/content/docs/` root)
2. If multiple unprocessed documents found, list with numbered options and ask user to select
3. Review and sanitize sensitive information
4. Optimize content for Starlight (remove TOC, verify formatting)
5. Generate frontmatter with `lastUpdated` from original or current date
6. Create English version in `src/content/docs/<filename>.md` (root directory)
7. Create Chinese translation in `src/content/docs/zh/<filename>.md`
8. Add entry to sidebar in `astro.config.mjs`
9. Rename source document to `./tmp/<filename>-YYYYMMDD.md`
10. Run `npm run fix` to auto-fix formatting issues
11. Run `npm run check` to verify quality standards
12. Verify all files created and report to user

### Workflow B: Reprocessing an Existing Document

1. Detect all documents are processed (have `-YYYYMMDD` timestamp OR similar document exists in `./src/content/docs/` root)
2. List all processed documents with numbered options
3. Ask user: "All documents have been processed. Would you like to reprocess any? Please select a number:"
4. If user confirms reprocessing:
   - Review and sanitize the updated content
   - Optimize content for Starlight
   - Generate frontmatter with `lastUpdated` set to **current date**
   - **Overwrite** existing `src/content/docs/<filename>.md` (root directory)
   - **Overwrite** existing `src/content/docs/zh/<filename>.md` with fresh translation
   - Sidebar entry already exists, **no update needed**
   - Update source document timestamp: `./tmp/<filename>-YYYYMMDD.md` (new date)
   - Run `npm run fix` to auto-fix formatting issues
   - Run `npm run check` to verify quality standards
   - Verify files updated and report to user
