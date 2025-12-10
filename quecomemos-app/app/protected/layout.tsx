import { AuthButton } from "@/components/auth";
import { Logo } from "@/components/common";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-muted/10">
        <div className="flex-1 w-full flex flex-col gap-1 items-center">
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-28 bg-background sticky top-0 z-50">
            <div className="w-full max-w-7xl flex justify-between items-center p-6 px-8 md:px-10 text-sm">
              <div className="flex gap-6 items-center font-semibold">
                <Logo size="xl" />
                <div className="hidden md:block">
                </div>
              </div>
              <div className="w-24"></div>
              <AuthButton />
            </div>
          </nav>
          <div className="flex-1 flex flex-col gap-16 w-full max-w-6xl p-4 md:p-6">
            {children}
          </div>
        </div>
      </main>
  );
}
