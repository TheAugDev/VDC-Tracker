# VDC Tracker Dashboard

A modern, responsive dashboard built with React and Vite for tracking VDC (Virtual Data Center) metrics and analytics.

## Features

- 📊 Real-time dashboard with key metrics
- 📈 Trend indicators for data tracking
- 🎨 Modern, clean UI with responsive design
- 🌓 Dark mode support
- ⚡ Fast performance with Vite

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TheAugDev/VDC-Tracker.git
cd VDC-Tracker
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

Build the application for production:
```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

## Project Structure

```
VDC-Tracker/
├── src/
│   ├── components/      # React components
│   │   ├── Header.jsx   # Navigation header
│   │   ├── Header.css
│   │   ├── Card.jsx     # Dashboard card component
│   │   └── Card.css
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
└── package.json         # Project dependencies
```

## Technologies

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **ESLint** - Code linting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

