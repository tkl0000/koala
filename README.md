# Koala Chrome Extension

A modern Chrome extension built with React, featuring a popup interface and content script functionality.

## Features

- 🦥 **Modern React UI** - Beautiful popup interface with gradient design
- 📊 **Page Analytics** - View current page information and word count
- 🎯 **Content Script** - Interactive overlay on web pages
- 💾 **Data Persistence** - Counter and settings stored in Chrome storage
- 🎨 **Responsive Design** - Works on all screen sizes
- ⚡ **Fast Build** - Webpack-powered development and production builds

## Project Structure

```
koala/
├── src/
│   ├── popup/           # Popup interface
│   │   ├── index.js     # Entry point
│   │   ├── Popup.jsx    # Main popup component
│   │   ├── popup.html   # HTML template
│   │   └── popup.css    # Popup styles
│   ├── content/         # Content script
│   │   ├── index.js     # Entry point
│   │   ├── ContentScript.jsx  # Content script component
│   │   └── content.css  # Content script styles
│   └── background/      # Background script
│       └── index.js     # Service worker
├── manifest.json        # Extension manifest
├── webpack.config.js    # Build configuration
└── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd koala
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Development

For development with auto-rebuild:
```bash
npm run dev
```

This will watch for file changes and rebuild automatically. After making changes, reload the extension in Chrome.

## Usage

### Popup Interface
- Click the extension icon to open the popup
- View current page information
- Use the counter feature
- Access extension options

### Content Script
- The content script automatically loads on all pages
- Click the koala emoji (🦥) in the top-right corner to open the overlay
- View page analytics and use highlighting features

### Background Script
- Handles extension lifecycle events
- Manages communication between popup and content scripts
- Provides context menu integration

## Building for Production

```bash
npm run build
```

The built extension will be in the `dist` folder, ready for packaging and distribution.

## Customization

### Adding New Features
1. Create new components in the appropriate `src/` subdirectory
2. Update the webpack configuration if needed
3. Add new permissions to `manifest.json` if required

### Styling
- Popup styles: `src/popup/popup.css`
- Content script styles: `src/content/content.css`
- Uses modern CSS with gradients and animations

### Permissions
Current permissions in `manifest.json`:
- `activeTab` - Access to current tab
- `storage` - Chrome storage API

Add more permissions as needed for your use case.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details