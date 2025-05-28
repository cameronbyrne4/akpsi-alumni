import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Alpha Kappa Psi Alumni Network
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Connecting brothers across generations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">Alumni Name</h2>
              <p className="text-muted-foreground">Role at Company</p>
              <p className="text-sm text-muted-foreground mt-2">Family Branch</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
