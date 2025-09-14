# Budget Buddy

A modern, intuitive personal finance tracking application built with React, TypeScript, and Supabase. Budget Buddy helps you track your expenses, visualize spending patterns, and manage your budget effectively.

![Budget Buddy Screenshot](/public/BudgetBuddy.png)

## Features

- 📊 Interactive dashboard with expense analytics
- 📈 Visual spending trends and category breakdowns
- 📱 Responsive design for all devices
- 🔐 Secure authentication with Supabase
- 🎨 Modern UI with smooth animations using Framer Motion
- 📱 PWA support for offline access

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Charts**: Chart.js with React-Chartjs-2
- **Animation**: Framer Motion
- **Backend**: Supabase (Authentication & Database)
- **Routing**: React Router v7
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/clay-egg/budget-buddy.git
   cd budget-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- `npm run dev` or `yarn dev` - Start the development server
- `npm run build` or `yarn build` - Build the app for production
- `npm run preview` or `yarn preview` - Preview the production build locally
- `npm test` or `yarn test` - Run tests

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and API clients
├── pages/          # Page components
└── types/          # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Chart.js](https://www.chartjs.org/)
