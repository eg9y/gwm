# Welcome to TanStack.com!

This site is built with TanStack Router!

- [TanStack Router Docs](https://tanstack.com/router)

It's deployed automagically with Netlify!

- [Netlify](https://netlify.com/)

## Development

From your terminal:

```sh
pnpm install
pnpm dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Editing and previewing the docs of TanStack projects locally

The documentations for all TanStack projects except for `React Charts` are hosted on [https://tanstack.com](https://tanstack.com), powered by this TanStack Router app.
In production, the markdown doc pages are fetched from the GitHub repos of the projects, but in development they are read from the local file system.

Follow these steps if you want to edit the doc pages of a project (in these steps we'll assume it's [`TanStack/form`](https://github.com/tanstack/form)) and preview them locally :

1. Create a new directory called `tanstack`.

```sh
mkdir tanstack
```

2. Enter the directory and clone this repo and the repo of the project there.

```sh
cd tanstack
git clone git@github.com:TanStack/tanstack.com.git
git clone git@github.com:TanStack/form.git
```

> [!NOTE]
> Your `tanstack` directory should look like this:
>
> ```
> tanstack/
>    |
>    +-- form/
>    |
>    +-- tanstack.com/
> ```

> [!WARNING]
> Make sure the name of the directory in your local file system matches the name of the project's repo. For example, `tanstack/form` must be cloned into `form` (this is the default) instead of `some-other-name`, because that way, the doc pages won't be found.

3. Enter the `tanstack/tanstack.com` directory, install the dependencies and run the app in dev mode:

```sh
cd tanstack.com
pnpm i
# The app will run on https://localhost:3000 by default
pnpm dev
```

4. Now you can visit http://localhost:3000/form/latest/docs/overview in the browser and see the changes you make in `tanstack/form/docs`.

> [!NOTE]
> The updated pages need to be manually reloaded in the browser.

> [!WARNING]
> You will need to update the `docs/config.json` file (in the project's repo) if you add a new doc page!

# GWM Indonesia Website

This is the official website for Great Wall Motors (GWM) Indonesia.

## Image Optimization with Cloudflare Image Transformations

This project uses Cloudflare Image Transformations during the image upload phase to create optimized versions of images for different devices and screen sizes. This provides several benefits:

- **Improved page load times**: Smaller file sizes mean faster loading, especially on mobile devices
- **Better user experience**: Images are automatically resized for the user's device
- **Reduced bandwidth costs**: We only transform images once during upload, not on-the-fly
- **Format conversion**: Images are converted to WebP format for better compression

### How It Works

We use a combination of strategies to optimize images:

1. **Upload Time Transformations**: During image upload, we create multiple versions (original, mobile, thumbnail) 
2. **Consistent Naming Conventions**: Mobile versions use the `_mobile` suffix in filenames
3. **Optimized Storage**: All versions are stored in R2 with predictable filenames
4. **No On-the-fly Costs**: We avoid on-the-fly transformations to minimize Cloudflare costs

### How to Use

#### In Admin Panel

When uploading images in the admin panel, you'll see an "Image Optimization" toggle that is enabled by default. This will:

1. Upload the original image to R2
2. Create a mobile version (640px width) with `_mobile` suffix
3. Store both versions in R2 with consistent naming
4. Return the original image URL for database storage

#### In Components

For developers, we provide a `ResponsiveImage` component that automatically creates appropriate srcsets based on our naming convention:

```jsx
import { ResponsiveImage } from "../components/ResponsiveImage";

// Basic usage
<ResponsiveImage 
  src="https://gwm.kopimap.com/image.jpg" 
  alt="Description of image" 
/>

// With responsive sizes
<ResponsiveImage 
  src="https://gwm.kopimap.com/image.jpg" 
  alt="Description of image"
  sizes="(max-width: 768px) 100vw, 800px" 
/>
```

The component will automatically generate the URL for the mobile version by adding `_mobile` before the file extension.

### Naming Convention

We use a simple naming convention for our transformed images:

- **Original**: `filename.jpg` - stored in the database
- **Mobile**: `filename_mobile.jpg` - 640px width, derived from original URL
- **Thumbnail**: `filename_thumbnail.jpg` - 320px width

### Existing Images Script

For existing images, use the optimization script:

```bash
npm run optimize-images
```

This will:
1. Process all existing images in car models
2. Create mobile (640px) and desktop (1200px) versions
3. Upload optimized versions to R2 storage with the appropriate naming convention

## Environment Variables

Make sure to add the following to your `.env` file:

```
CLOUDFLARE_ZONE_ID=e58d07744620fbe99affce3dae4348af
```
