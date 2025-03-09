# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>

# Strapi CMS for GWM Indonesia

This is a lightweight Strapi CMS integration for the GWM Indonesia website, primarily used to manage news articles for the Info & Promo section.

## Getting Started

### Starting the CMS Server

From the root directory:

```bash
cd cms
npm run develop
```

This will start the Strapi admin panel at http://localhost:1337/admin.

### Accessing the Admin Panel

- Visit http://localhost:1337/admin in your browser
- Login with your admin credentials
- You can also access the admin panel from the main site by visiting /admin

## Content Structure

### Articles

Each article has the following fields:

- **Title**: The headline of the article
- **Slug**: URL-friendly version of the title (auto-generated but editable)
- **Content**: Main article content (rich text)
- **Excerpt**: Short summary of the article
- **Category**: One of "News" or "Promo"
- **Featured Image**: Main image for the article

## API Endpoints

The following API endpoints are available:

- **List articles**: GET /api/articles
- **Single article**: GET /api/articles/:id
- **Filter by slug**: GET /api/articles?filters[slug][$eq]=your-article-slug
- **Filter by category**: GET /api/articles?filters[category][$eq]=News

## Front-end Integration

The front-end React application fetches data from these endpoints to display:

1. **Info & Promo page**: Shows a grid of article cards with filtering and pagination
2. **Article detail page**: Shows a full article when clicked from the Info & Promo page

## Production Deployment

For production:

1. Make sure to set proper environment variables for database connection
2. Configure proper authentication for the admin panel
3. Consider setting up a CDN for media files
4. Add proper rate limiting and security headers

## Customizing

To modify the content structure:

1. Go to Content-Type Builder in the admin panel
2. Make your changes to the Article type or create new types
3. Update the front-end code to match any schema changes
