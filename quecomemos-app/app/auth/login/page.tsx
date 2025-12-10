import { LoginForm, PreventBackNavigation } from "@/components/auth";
import { Logo } from "@/components/common";

export default function Page() {
  return (
    <>
      <PreventBackNavigation />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/20">
        <div className="w-full max-w-md flex flex-col items-center space-y-8">
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="mb-4">
              <Logo size="xl" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mt-2">
                El sabor de la democracia en cada comida
              </p>
            </div>
          </div>
          
          {/* Login Form */}
          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
