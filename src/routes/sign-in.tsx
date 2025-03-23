import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignIn, useAuth } from "@clerk/tanstack-start";
import { useEffect } from "react";
import { z } from "zod";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
});

function SignInPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { redirect } = Route.useSearch();

  // If user is already signed in, redirect to the intended page or home
  useEffect(() => {
    if (isSignedIn) {
      navigate({ to: redirect ? redirect : "/" });
    }
  }, [isSignedIn, navigate, redirect]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <img
              src="/logo.png"
              alt="GWM Indonesia Logo"
              className="h-12 mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-medium text-primary mb-2">
            Masuk ke Admin Panel
          </h1>
          <p className="text-gray-600">
            Silakan masuk untuk mengakses admin dashboard
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <SignIn
            signUpUrl="/sign-up"
            redirectUrl={redirect || "/"}
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
                card: "bg-transparent shadow-none",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
