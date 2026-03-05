// carfindr/src/components/PlatformBanner.tsx
import React from 'react';

const PlatformBanner: React.FC = () => {

  // Optional: Smooth scroll handler
  const handleScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault(); // Prevent default jump
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start' // Aligns the top of the target element to the top of the scroll container
      });
    }
  };

  return (
    <div className="sticky top-20 z-10 mx-auto mb-6 w-full max-w-[1200px] rounded-2xl border border-white/70 bg-white/80 p-2 shadow-lg shadow-slate-900/5 backdrop-blur-md">
      <nav className="flex items-center justify-around gap-2">
        <a
          href="#cochesnet-results"
          onClick={(e) => handleScroll(e, 'cochesnet-results')}
          className="flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
        >
           <img src="https://cdn.brandfetch.io/idWECT352Y/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1743681796165" alt="" className="h-4 inline-block" />
           <span>Coches.net</span>
        </a>
        <a
          href="#wallapop-results"
           onClick={(e) => handleScroll(e, 'wallapop-results')}
          className="flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
        >
           <img src="https://play-lh.googleusercontent.com/uykj6t0svCeUYDUEG1osUlslAhb3aFQNzPrbKibBv5cZDH_ZdjiwVWsrQFt_pXUdbYw" alt="" className="h-4 inline-block rounded-md" />
           <span>Wallapop</span>
        </a>
        <a
          href="#milanuncios-results"
           onClick={(e) => handleScroll(e, 'milanuncios-results')}
          className="flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
        >
           <img src="https://www.milanuncios.com/prensa/wp-content/uploads/2020/11/M-Icon-Round.png" alt="" className="h-4 inline-block" />
           <span>Milanuncios</span>
        </a>
      </nav>
    </div>
  );
};

export default PlatformBanner;
