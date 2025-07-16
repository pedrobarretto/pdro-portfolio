import { Github, Linkedin, Download, Award, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { EmailButton } from '@/components/email-button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-lg mx-auto text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-left">
              Pedro Barretto
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-left">
              Computer Science graduate with 5 years of Full Stack development
              experience. Specialized in TypeScript, Node.js, and React.js, with
              recent focus on AI. Seeking opportunities with international
              companies.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" className="w-full" asChild>
                <a
                  href="https://linkedin.com/in/pedrobarretto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full" asChild>
                <a
                  href="https://github.com/pedrobarretto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  GitHub
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full" asChild>
                <a
                  href="https://twitter.com/pedrobarretto_"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
                    <g>
                      <path className="fill-zinc-950 dark:fill-zinc-200" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </g>
                  </svg>
                  X (formerly Twitter)
                </a>
              </Button>

              <EmailButton email="pedro@barretto.com.br" variant="outline" />
            </div>

            <div className="space-y-3">
              <Button size="lg" className="w-full" asChild>
                <a href="https://drive.google.com/file/d/1owQff3WJtIxfCPu4TJKbymwGngXCC882/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-3 h-5 w-5" />
                  Check my Resume
                </a>
              </Button>
            </div>

            <div className="space-y-3 text-left">
              <h3 className="text-sm font-medium text-muted-foreground">Important Links</h3>
              <div className="space-y-2">
                <a
                  href="https://learn.microsoft.com/api/credentials/share/en-us/pedrobarretto/2952F24E138CD2EC?sharingId=63C63473E1AC336B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Award className="mr-2 h-4 w-4" />
                  AI-900 Azure Certification
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
