# GRID STAT

GRID STAT is a modern data visualization dashboard built with Astro and React, designed to display and analyze environmental and greenhouse gas (GHG) statistics.

## 🚀 Features

- **Interactive Dashboard**: Dynamic visualization of environmental indicators and GHG data
- **Multiple View Modes**: Switch between chart and table views for data analysis
- **Advanced Filtering**: Search and filter indicators by topics and keywords
- **Responsive Design**: Fully responsive layout with a clean, modern interface
- **Real-time Data**: Integration with UNEP GRID API for up-to-date environmental statistics

## 🛠️ Tech Stack

- [Astro](https://astro.build) - Web framework for content-driven websites
- [React](https://reactjs.org) - UI component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Recharts](https://recharts.org) - Composable charting library
- [TypeScript](https://www.typescriptlang.org) - Static typing for JavaScript
- [Lucide React](https://lucide.dev) - Beautiful & consistent icon system

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/unep-grid/grid_stat
cd grid_stat
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview the production build:
```bash
npm run preview
```

## 🏗️ Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── dashboard/          # Main dashboard components
│   │   └── ui/                 # Reusable UI components
│   ├── data/                   # Mock data and indicators
│   ├── layouts/                # Astro layout templates
│   ├── pages/                  # Route pages
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── astro.config.mjs           # Astro configuration
├── tailwind.config.mjs        # Tailwind CSS configuration
└── package.json
```

## 🔧 Configuration

The project uses Astro's configuration file (`astro.config.mjs`) with the following integrations:
- MDX support
- Sitemap generation
- React components
- Tailwind CSS (with custom configuration)

## 📝 API Integration

The dashboard integrates with the UNEP GRID API to fetch environmental indicators:
```typescript
const response = await fetch('https://api.unepgrid.ch/stats/v1/indicators?language=eq.en');
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT ?

## 🙏 Acknowledgments

- UNEP GRID for providing the environmental data API
- The Astro team for the excellent web framework
- All contributors to this project
