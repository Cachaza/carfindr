import { getBrands } from '@/app/actions/marcasModelos';
import Search from './Search';
import { Suspense } from 'react';

export default async function SearchWrapper() {
  const brands = await getBrands();
  
  return (
    <div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-600"></div>
          <span className="ml-3 text-slate-700">Cargando...</span>
        </div>
      }>
        <Search initialBrands={brands} />
      </Suspense>
    </div>
  );
}
