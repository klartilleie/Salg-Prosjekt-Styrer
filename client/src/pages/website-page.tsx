import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BiocleanerQuoteForm } from "@/components/biocleaner-quote-form";

export default function WebsitePage({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      {!embedded && <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Smart Hjem AS</p>
            <p className="font-semibold">Tilbud på Biocleaner</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/logg-inn">Åpne appen</Link>
          </Button>
        </div>
      </header>}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tilbud på Biocleaner renseanlegg</h1>
          <p className="mt-2 text-muted-foreground">
            Samme tilbudsskjema som i befaringen, med modell, type og prislinjer.
          </p>
        </div>
        <BiocleanerQuoteForm />
      </main>
    </div>
  );
}
