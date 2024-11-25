import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { Navbar } from "./Navbar";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ThemeProvider>
      <div>
        <Navbar />
        {children}
      </div>
    </ThemeProvider>
  );
}
