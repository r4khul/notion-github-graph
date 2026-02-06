# Notion GitHub Graph

A minimal, aesthetic contribution graph designed for Notion. It fetches your GitHub activity and renders it as a crisp heatmap that matches Notion's native UI perfectly.

This project vibe coded itself.

### Why this?

Most GitHub graph generators are cluttered or don't look right when embedded. This one is built to be "invisible"—it adapts to Notion's light and dark modes, uses clean typography, and sticks to a minimal footprint.

### Features

- **Auto-Theming**: Automatically switches between light and dark modes based on system/Notion settings.
- **Precision Tooltips**: Shows exact contribution counts on hover or tap. The positioning is smart—it won't get cut off at the edges.
- **Yearly Navigation**: Interactive controls to jump back through your history or view the last 365 days.
- **Mobile First**: Fully responsive with optimized touch targets for dragging through the graph on your phone.
- **Zero Config**: Just pass a username and it works.

### How to use

The easiest way is to use the hosted version: `https://r4khul.github.io/notion-github-graph/`

**Quick Embed:**
You can just add your username to the end of the URL:

- `https://r4khul.github.io/notion-github-graph/YOUR_USERNAME`
- Or use the parameter: `https://r4khul.github.io/notion-github-graph/?user=YOUR_USERNAME`

**In Notion:**

1. Copy the link with your username.
2. In your Notion page, type `/embed`.
3. Paste the URL and hit enter.
4. Resize the block to your liking.

### Local Development

If you want to run it yourself or tweak the styles:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Options

- **Username**: Set via the `user` URL parameter.
- **Theme**: Follows your system `prefers-color-scheme`.
- **Navigation**: Use the arrows in the header to cycle through available years of data.
