import MonsterGenerator from "@/components/ui/MonsterGenerator";

export default function HomePage() {
  return (
    <div className="min-h-screen menu-screen">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gaming-primary rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gaming-secondary rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gaming-accent rounded-full blur-xl animate-pulse-glow"></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-gaming-primary rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Main content */}
      <div className="relative">
        <div className="pt-8 pb-16">
          <MonsterGenerator />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gaming-border bg-gaming-bg-tertiary/80">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gaming-text-secondary mb-2 font-gaming">
              Monster Generator for DOOM-Style FPS Games
            </p>
            <p className="text-sm text-gaming-text-muted">
              Generate JSON demon configurations using natural language and AI.
              Export and import directly into your game.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gaming-border text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gaming-text-muted">
              <span className="hover:text-gaming-primary transition-colors">
                Powered by OpenSota AI
              </span>
              <span>•</span>
              <span className="hover:text-gaming-primary transition-colors">
                Built with Next.js
              </span>
              <span>•</span>
              <span className="hover:text-gaming-primary transition-colors">
                Open Source
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
