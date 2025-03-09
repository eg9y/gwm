/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as KontakImport } from './routes/kontak'
import { Route as InfoPromoImport } from './routes/info-promo'
import { Route as AdminImport } from './routes/admin'
import { Route as IndexImport } from './routes/index'
import { Route as ArtikelSlugImport } from './routes/artikel/$slug'

// Create/Update Routes

const KontakRoute = KontakImport.update({
  id: '/kontak',
  path: '/kontak',
  getParentRoute: () => rootRoute,
} as any)

const InfoPromoRoute = InfoPromoImport.update({
  id: '/info-promo',
  path: '/info-promo',
  getParentRoute: () => rootRoute,
} as any)

const AdminRoute = AdminImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ArtikelSlugRoute = ArtikelSlugImport.update({
  id: '/artikel/$slug',
  path: '/artikel/$slug',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/admin': {
      id: '/admin'
      path: '/admin'
      fullPath: '/admin'
      preLoaderRoute: typeof AdminImport
      parentRoute: typeof rootRoute
    }
    '/info-promo': {
      id: '/info-promo'
      path: '/info-promo'
      fullPath: '/info-promo'
      preLoaderRoute: typeof InfoPromoImport
      parentRoute: typeof rootRoute
    }
    '/kontak': {
      id: '/kontak'
      path: '/kontak'
      fullPath: '/kontak'
      preLoaderRoute: typeof KontakImport
      parentRoute: typeof rootRoute
    }
    '/artikel/$slug': {
      id: '/artikel/$slug'
      path: '/artikel/$slug'
      fullPath: '/artikel/$slug'
      preLoaderRoute: typeof ArtikelSlugImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/info-promo': typeof InfoPromoRoute
  '/kontak': typeof KontakRoute
  '/artikel/$slug': typeof ArtikelSlugRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/info-promo': typeof InfoPromoRoute
  '/kontak': typeof KontakRoute
  '/artikel/$slug': typeof ArtikelSlugRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/info-promo': typeof InfoPromoRoute
  '/kontak': typeof KontakRoute
  '/artikel/$slug': typeof ArtikelSlugRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/admin' | '/info-promo' | '/kontak' | '/artikel/$slug'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/admin' | '/info-promo' | '/kontak' | '/artikel/$slug'
  id: '__root__' | '/' | '/admin' | '/info-promo' | '/kontak' | '/artikel/$slug'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AdminRoute: typeof AdminRoute
  InfoPromoRoute: typeof InfoPromoRoute
  KontakRoute: typeof KontakRoute
  ArtikelSlugRoute: typeof ArtikelSlugRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AdminRoute: AdminRoute,
  InfoPromoRoute: InfoPromoRoute,
  KontakRoute: KontakRoute,
  ArtikelSlugRoute: ArtikelSlugRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/admin",
        "/info-promo",
        "/kontak",
        "/artikel/$slug"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/admin": {
      "filePath": "admin.tsx"
    },
    "/info-promo": {
      "filePath": "info-promo.tsx"
    },
    "/kontak": {
      "filePath": "kontak.tsx"
    },
    "/artikel/$slug": {
      "filePath": "artikel/$slug.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
