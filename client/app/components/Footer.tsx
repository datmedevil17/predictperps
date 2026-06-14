import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Limit Break Logo" width={120} height={24} className="h-5 w-auto object-contain" />
        </div>
        <p className="text-sm text-muted text-center sm:text-left">
          © {new Date().getFullYear()} Limit Break. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>
      </div>
    </footer>
  );
}
