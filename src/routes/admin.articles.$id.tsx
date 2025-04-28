import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { getArticleById } from "../server/articles";
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
