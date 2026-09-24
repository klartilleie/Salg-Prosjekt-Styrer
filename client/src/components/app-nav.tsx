import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CheckSquare, LayoutDashboard, User, Users, Wallet } from "lucide-react";

const items = [
  { title: "Oversikt", url: "/app", icon: LayoutDashboard },
  { title: "Tilbud", url: "/app/tilbud", icon: Users },
  { title: "Utbetaling", url: "/app/utbetalinger", icon: Wallet },
  { title: "Profil", url: "/app/profil", icon: User },
];

export function AppNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const links = user?.role === "admin"
    ? [...items, { title: "Admin", url: "/app/admin/godkjenninger", icon: CheckSquare }]
    : items;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background md:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map((item) => {
          const active = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
