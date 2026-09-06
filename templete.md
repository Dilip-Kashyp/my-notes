# Note Template

Use this structure for every note so headings, navigation, and nested points render consistently.

## Formatting rules

- Use one `# H1` for the note title. The application displays the metadata title above the note, so the Markdown H1 is optional and should not repeat the title.
- Use `## H2` for major chapters. Each H2 becomes a numbered item in the contents sidebar.
- Use `### H3` for a child section inside the current H2. H3 items are numbered beneath their parent H2.
- Use `#### H4` and lower headings only for deeper detail. They render normally but are not added to the sidebar.
- Use `-` for unordered points and `1.` for ordered steps. Indent child points by two spaces under their parent.
- Use fenced code blocks with a language name, such as ```` ```python ```` or ```` ```text ````.
- Use `---` between large sections instead of long lines made from hyphens.

## Example

````markdown
# Optional Note Title

Short introduction to the topic.

## 1. Main chapter

Explain the main idea here.

- Parent point
  - Child point
  - Another child point

### Example

```python
print("Hello, notes")
```

## 2. Next chapter

Continue with the next major idea.
````

The note metadata controls the card title, description, topic, and author details. Add author contact values to `metadata.js`; the author name is shown on the card and at the top of the note, and clicking it opens the available contact links.
