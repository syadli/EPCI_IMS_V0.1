import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { ProjectProvider } from "@/lib/projectContext";
import { ThemeProvider } from "@/lib/themeContext";

export const metadata: Metadata = {
  title: "EPCI Interface Management System",
  description: "Enterprise Interface Request Management for EPCI Projects — Track, validate, and close out interface requests between contractors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
