import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { name: "Home", href: import.meta.env.BASE_URL + "/" },
  { name: "Data", href: import.meta.env.BASE_URL + "/data" },
  { name: "About", href: import.meta.env.BASE_URL + "/about" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Set current path
  useEffect(() => {
    const path = window.location.pathname;
    setCurrentPath(
      path === import.meta.env.BASE_URL
        ? "/"
        : path.replace(import.meta.env.BASE_URL, "")
    );
  }, []);

  const isActive = (href: string) => {
    const itemPath = href.replace(import.meta.env.BASE_URL, "");
    return (
      itemPath === currentPath ||
      (itemPath === "/" && currentPath === "") ||
      (itemPath !== "/" && currentPath.startsWith(itemPath))
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 w-full">
        <div className="mr-4 flex items-center logo">
          <a
            href={import.meta.env.BASE_URL + "/"}
            className="flex items-center"
          >
            <Logo className="logo h-8 top-0" />
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink
                      href={active ? undefined : item.href}
                      className={`group inline-flex h-9 w-max items-center justify-center  bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                        active
                          ? "border-b-2 border-primary pointer-events-none"
                          : ""
                      }`}
                    >
                      {item.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden">
            <div className="py-4">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.name}
                    href={active ? undefined : item.href}
                    className={`block px-4 py-2 text-sm hover:bg-accent rounded-md ${
                      active
                        ? "border-l-4 border-primary bg-accent/50 pointer-events-none"
                        : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
