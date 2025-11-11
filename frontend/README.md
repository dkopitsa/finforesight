# FinForesight Frontend

Angular 20 frontend application for FinForesight - a financial planning and forecasting platform.

## Tech Stack

- **Angular 20** - Modern web framework with standalone components
- **ng-zorro-antd 20.4.0** - Enterprise-class UI components based on Ant Design
- **SCSS** - Sass styling with CSS syntax
- **TypeScript 5.9** - Type-safe development
- **RxJS 7.8** - Reactive programming
- **Angular Router** - Client-side navigation

## Prerequisites

- Node.js 22.20.0 or higher
- npm 10.9.3 or higher
- Angular CLI 20.3.9 (installed automatically)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200/`

### 3. Backend API

The backend API should be running at `http://localhost:8000`. API requests are automatically proxied through the Angular dev server (see `proxy.conf.json`).

To start the backend:
```bash
cd ../backend
make run
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on `http://localhost:4200` |
| `npm run build` | Build production bundle to `dist/` |
| `npm run build:dev` | Build development bundle |
| `npm test` | Run unit tests with Karma |
| `npm run lint` | Run linter (if configured) |
| `ng generate component <name>` | Generate new component |
| `ng generate service <name>` | Generate new service |

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Application components and modules
│   │   ├── app.ts           # Root component
│   │   ├── app.html         # Root template
│   │   ├── app.scss         # Root styles
│   │   ├── app.config.ts    # App configuration
│   │   └── app.routes.ts    # Route definitions
│   ├── assets/              # Static assets (images, icons, etc.)
│   ├── main.ts              # Application entry point
│   ├── index.html           # HTML template
│   └── styles.scss          # Global styles
├── public/                  # Public assets (favicon, etc.)
├── angular.json             # Angular CLI configuration
├── tsconfig.json            # TypeScript configuration
├── proxy.conf.json          # API proxy configuration
└── package.json             # npm dependencies

```

## API Integration

### Proxy Configuration

API requests to `/api/*` are automatically proxied to `http://localhost:8000` during development. This is configured in `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### Example API Call

```typescript
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

// This will be proxied to http://localhost:8000/api/v1/accounts
this.http.get('/api/v1/accounts').subscribe(data => {
  console.log(data);
});
```

## UI Components (ng-zorro)

This project uses **ng-zorro-antd** for UI components. The library is already configured and styles are imported in `angular.json`.

### Using ng-zorro Components

1. Import the component module in your component file:

```typescript
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  standalone: true,
  imports: [NzButtonModule],
  // ...
})
```

2. Use in your template:

```html
<button nz-button nzType="primary">Primary Button</button>
```

### Resources
- [ng-zorro Documentation](https://ng.ant.design/docs/introduce/en)
- [Component Examples](https://ng.ant.design/components/overview/en)

## Angular MCP Server

This project is configured to work with the **Angular Model Context Protocol (MCP) server**, which provides AI assistants like Claude with real-time access to:

- Angular best practices and documentation
- Project structure analysis
- Component generation assistance

### Configuration

The Angular MCP server is configured in `/.mcp.json`:

```json
{
  "mcpServers": {
    "angular": {
      "command": "npx",
      "args": ["-y", "@angular/cli@latest", "mcp"],
      "cwd": "${workspaceFolder}/frontend"
    }
  }
}
```

### Usage

When using Claude Code or other MCP-compatible AI assistants, the Angular MCP server provides:

- **Best Practices**: `get_best_practices` - Current Angular coding standards
- **Documentation Search**: `search_documentation` - Real-time angular.dev search
- **Workspace Analysis**: Context about your Angular project structure

## Code Scaffolding

Generate new Angular artifacts using Angular CLI:

```bash
# Generate a new component
ng generate component features/dashboard

# Generate a new service
ng generate service core/services/auth

# Generate a new guard
ng generate guard core/guards/auth

# Generate a new directive
ng generate directive shared/directives/highlight

# Generate a new pipe
ng generate pipe shared/pipes/currency-format

# See all available schematics
ng generate --help
```

## Building

### Development Build

```bash
ng build --configuration=development
```

### Production Build

```bash
ng build --configuration=production
```

Build artifacts will be stored in the `dist/frontend/` directory.

## Testing

### Unit Tests

Run unit tests with Karma:

```bash
ng test
```

### End-to-End Tests

E2E testing framework is not included by default. Popular options:
- [Cypress](https://www.cypress.io/)
- [Playwright](https://playwright.dev/)
- [Protractor](http://www.protractortest.org/) (deprecated)

## Styling Guidelines

- Use SCSS for component and global styles
- Follow BEM naming convention for CSS classes
- Utilize ng-zorro theme variables for consistency
- Keep component styles scoped to the component

## Best Practices

1. **Standalone Components**: Use standalone components (default in Angular 20)
2. **Lazy Loading**: Implement lazy loading for feature modules
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Reactive Forms**: Prefer reactive forms over template-driven forms
5. **OnPush**: Use `ChangeDetectionStrategy.OnPush` for better performance
6. **Async Pipe**: Use async pipe to handle observables in templates
7. **RxJS**: Use RxJS operators for complex data transformations

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [ng-zorro-antd](https://ng.ant.design/docs/introduce/en)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Backend API Documentation

The backend API documentation is available at `http://localhost:8000/api/v1/docs` when the backend server is running.

## License

Copyright © 2025 FinForesight
