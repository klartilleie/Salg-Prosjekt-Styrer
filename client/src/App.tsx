import { useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNav } from "@/components/app-nav";
import NotFound from "@/pages/not-found";
import WebsitePage from "@/pages/website-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CustomersPage from "@/pages/customers-page";
import PayoutsPage from "@/pages/payouts-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminApprovalsPage from "@/pages/admin-approvals-page";
import AdminPayoutsPage from "@/pages/admin-payouts-page";
import ProfilePage from "@/pages/profile-page";
import { Loader2 } from "lucide-react";
import { apiRequest } from "./lib/queryClient";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <p className="font-semibold md:hidden">Tilbud</p>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
            {children}
          </main>
          <AppNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedPage({ component: Component }: { component: () => React.JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/logg-inn" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function loginRedirectPath(nextPath: string) {
  return `/logg-inn?next=${encodeURIComponent(nextPath)}`;
}

function AdminPage({ component: Component }: { component: () => React.JSX.Element }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return <Redirect to={loginRedirectPath(`${location}${search}`)} />;
  }

  if (user.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Ingen tilgang</h1>
            <p className="text-muted-foreground">Du må være administrator for å se denne siden</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

/** Innsendte skjema: kun tilgjengelig via hemmelig lenke fra e-post (?k=...). */
function FormsAdminPage() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [access, setAccess] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (isLoading || !user || user.role !== "admin") return;

    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const key = params.get("k") || "";

    (async () => {
      try {
        if (key) {
          await apiRequest("POST", "/api/admin/forms-access", { k: key });
          if (!cancelled) setAccess("ok");
          return;
        }
        const res = await fetch("/api/admin/forms-access", { credentials: "include" });
        const data = res.ok ? await res.json() : { ok: false };
        if (!cancelled) setAccess(data.ok ? "ok" : "denied");
      } catch {
        if (!cancelled) setAccess("denied");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, location]);

  if (isLoading || (user?.role === "admin" && access === "loading")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return <Redirect to={loginRedirectPath(`${location}${search}`)} />;
  }

  if (user.role !== "admin" || access === "denied") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold mb-2">Ingen tilgang</h1>
            <p className="text-muted-foreground">
              Denne siden er ikke i menyen. Åpne den via lenken som sendes på e-post når et nytt skjema kommer inn.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AdminApprovalsPage />
    </AppLayout>
  );
}

function HomePage() {
  return <WebsitePage />;
}

function AppQuotePage() {
  return <WebsitePage embedded />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/logg-inn" component={AuthPage} />
      <Route path="/auth">
        <Redirect to="/logg-inn" />
      </Route>
      <Route path="/app">
        <ProtectedPage component={DashboardPage} />
      </Route>
      <Route path="/app/tilbud">
        <ProtectedPage component={AppQuotePage} />
      </Route>
      <Route path="/app/kunder">
        <ProtectedPage component={CustomersPage} />
      </Route>
      <Route path="/app/utbetalinger">
        <ProtectedPage component={PayoutsPage} />
      </Route>
      <Route path="/app/profil">
        <ProtectedPage component={ProfilePage} />
      </Route>
      <Route path="/app/admin/brukere">
        <AdminPage component={AdminUsersPage} />
      </Route>
      <Route path="/app/admin/godkjenninger">
        <FormsAdminPage />
      </Route>
      <Route path="/app/admin/utbetalinger">
        <AdminPage component={AdminPayoutsPage} />
      </Route>
      <Route path="/customers">
        <Redirect to="/app/kunder" />
      </Route>
      <Route path="/payouts">
        <Redirect to="/app/utbetalinger" />
      </Route>
      <Route path="/profile">
        <Redirect to="/app/profil" />
      </Route>
      <Route path="/admin/users">
        <Redirect to="/app/admin/brukere" />
      </Route>
      <Route path="/admin/approvals">
        <Redirect to="/app/admin/godkjenninger" />
      </Route>
      <Route path="/admin/payouts">
        <Redirect to="/app/admin/utbetalinger" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="crm-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
