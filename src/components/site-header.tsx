import { Link } from "react-router-dom"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
// import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold">ParkEase</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-foreground/80 text-foreground"
              )}
            >
              Đặt Chỗ
            </Link>
            <Link
              to="/lookup"
              className={cn(
                "transition-colors hover:text-foreground/80 text-foreground/60"
              )}
            >
              Tra Cứu
            </Link>
            <Link
              to="/admin"
              className={cn(
                "transition-colors hover:text-foreground/80 text-foreground/60"
              )}
            >
              Quản Trị
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
