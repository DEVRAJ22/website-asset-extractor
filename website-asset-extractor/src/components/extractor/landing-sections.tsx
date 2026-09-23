import { ExtractorDashboard } from "@/components/extractor/extractor-dashboard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ImageIcon, Layers, Shield } from "lucide-react";

const faqs = [
  {
    q: "What is Website Asset Extractor?",
    a: "It is a free tool that scans public web pages and lists downloadable images, videos, audio, SVGs, icons, and linked files with previews and ZIP export.",
  },
  {
    q: "Can it extract images from JavaScript-heavy sites?",
    a: "Locally, Playwright can render dynamic pages when needed. On serverless deployments, static HTML fetching is used, which works for most marketing sites and blogs.",
  },
  {
    q: "Do you store my scans?",
    a: "No database is used. Scan results live in temporary server memory for about 30 minutes so you can download assets securely.",
  },
  {
    q: "Will it bypass login or paywalls?",
    a: "No. Only publicly accessible URLs are supported. Authentication, CAPTCHA, and anti-bot pages are not bypassed.",
  },
];

export function LandingPage() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Layers className="size-5" />
            Website Asset Extractor
          </div>
          <a
            href="#scanner"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Start scanning
          </a>
        </div>
      </header>

      <main>
        <section className="border-b bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="max-w-3xl space-y-6">
              <Badge variant="secondary" className="rounded-full">
                URL → scan → download
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Website Asset Extractor
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Extract images from website pages, collect media assets, and download website images in one clean dashboard — a fast website image downloader for public URLs.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Extract Images From Website</span>
                <span aria-hidden>·</span>
                <span>Extract Website Media</span>
                <span aria-hidden>·</span>
                <span>Download Website Images</span>
              </div>
            </div>
          </div>
        </section>

        <ExtractorDashboard />

        <section className="border-t bg-muted/10 py-16" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="features-heading" className="mb-8 text-2xl font-semibold tracking-tight">
              Built for reliable media extraction
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="size-4" />
                    Deep image detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  img, srcset, picture, lazy attributes, Open Graph / Twitter images, favicons, and CSS backgrounds.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="size-4" />
                    Bulk download
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Select assets, download individually, or export everything as a ZIP with safe duplicate filenames.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="size-4" />
                    SSRF-safe scanning
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Public URLs only, with timeouts, size limits, and blocked private networks and metadata endpoints.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl px-4">
            <h2 id="faq-heading" className="mb-6 text-2xl font-semibold tracking-tight">
              FAQ
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Website Asset Extractor — extract website media from public pages. No accounts required.
      </footer>
    </>
  );
}
