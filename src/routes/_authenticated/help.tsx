import { createFileRoute } from "@tanstack/react-router";
import { UserGuideContent } from "@/components/UserGuideContent";

export const Route = createFileRoute("/_authenticated/help")({
  component: AuthenticatedHelpGuidePage,
});

function AuthenticatedHelpGuidePage() {
  return (
    <div className="pb-8">
      <UserGuideContent variant="app" />
    </div>
  );
}

