import { createFileRoute } from "@tanstack/react-router";
import ArticleEditor from "../components/ArticleEditor";
import { useAuth } from "@clerk/tanstack-start";

export const Route = createFileRoute("/admin/articles/new")({
  component: NewArticleEditorPage,
});

function NewArticleEditorPage() {
  const { isSignedIn } = useAuth();

  // If not signed in, redirect to sign in page (handled by parent route)
  if (!isSignedIn) {
    return null;
  }

  return <ArticleEditor isNew={true} article={null} id="new" />;
}
