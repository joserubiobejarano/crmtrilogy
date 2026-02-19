import Link from "next/link";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app/events", label: "Entrenamientos" },
  { href: "/app/people", label: "Participantes" },
  { href: "/app/reports", label: "Reportes" },
  { href: "/app/historial", label: "Historial" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="grid grid-cols-3 items-center border-b px-6 py-4">
        <Link href="/app" className="ml-4 text-xl font-semibold">
          Trilogy
        </Link>
        <nav className="flex justify-center items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div />
      </header>
      <main className="min-w-0 flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
