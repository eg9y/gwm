import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useState, useEffect, FormEvent, useRef } from "react";
import { useAuth } from "@clerk/tanstack-start";
import { Loader2, ChevronLeft, Save, Upload, Eye } from "lucide-react";
import {
  getArticleById,
  createArticle,
  updateArticle,
} from "../server/articles";
import { getPresignedUploadUrl } from "../services/r2Service";
import ArticleEditor from "../components/ArticleEditor";

export const Route = createFileRoute("/admin/articles/$id")({
  component: ArticleEditorPage,
  // Loader to fetch article data for editing
  loader: async ({ params }) => {
    // If the id is 'new', we're creating a new article
    if (params.id === "new") {
      return { article: null, isNew: true };
    }

    try {
      const id = Number(params.id);

      // If ID is not a valid number, create a new article
      if (Number.isNaN(id) || id <= 0) {
        return { article: null, isNew: true };
      }

      const article = await getArticleById({ data: { id } });

      if (!article) {
        throw new Error("Article not found");
      }

      return {
        article,
        isNew: false,
      };
    } catch (error) {
      throw new Error("Failed to load article");
    }
  },
});

function ArticleEditorPage() {
  const { article, isNew } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { isSignedIn } = useAuth();

  // If not signed in, redirect to sign in page
  if (!isSignedIn) {
    return null; // The root layout will handle the redirect
  }

  return <ArticleEditor isNew={isNew} article={article} id={id} />;
}
