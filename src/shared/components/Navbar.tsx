import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';

const links = [
  { to: '/documents', label: 'Documents' },
  { to: '/chat', label: 'Chat' },
  { to: '/about', label: 'About' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-white/80 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_-8px_rgba(10,22,40,0.12)]">
          <div className="rounded-full bg-white px-4 py-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
            <Link to="/" className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-legal-secondary" />
              <span className="font-serif text-sm font-bold text-legal-primary tracking-tight">LegalAI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    active
                      ? 'text-white bg-legal-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'text-legal-accent hover:text-legal-primary hover:bg-black/[0.03]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.03] transition-colors duration-300"
            aria-label="Toggle menu"
          >
            <div className="relative w-4 h-3.5">
              <span
                className={`absolute left-0 top-0 w-full h-[1.5px] bg-legal-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                  open ? 'translate-y-[6.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-[0.75px] w-full h-[1.5px] bg-legal-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`absolute left-0 bottom-0 w-full h-[1.5px] bg-legal-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                  open ? '-translate-y-[6.5px] -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-legal-primary/95 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {links.map((link, i) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`text-2xl font-sans font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  active
                    ? 'text-legal-secondary'
                    : 'text-white/70 hover:text-white'
                }`}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: open ? `${i * 100}ms` : '0ms',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
