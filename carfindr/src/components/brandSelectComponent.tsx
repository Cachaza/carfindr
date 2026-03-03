// BrandSelect.tsx
'use client'

import React, { useState } from 'react';


type Marca = {
    label: string;
    cochesNetId: number;
    milanunciosId: string | null;
    wallapopId: string | null;
    cochesComId: string | null;
};

type Modelo = {
    cochesNetMarcaId: number;
    cochesNetModeloId: number;
    milanunciosMarcaId: string | null;
    milanunciosModeloId: string | null;
    wallapopMarcaId: string | null;
    wallapopModeloId: string | null;
    cochesComMarcaId: string | null;
    cochesComModeloId: string | null;
};

type Props = {
  brands: Marca[];
  getModels: (brandId: string) => Promise<Modelo[]>;
};

export const BrandSelect: React.FC<Props> = ({ brands, getModels }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<Modelo[]>([]);

  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setSelectedBrand(brandId);
    if (brandId && brandId !== 'all') {
      const brandModels = await getModels(brandId);
      setModels(brandModels);
    } else {
      setModels([]);
    }
  };

  return (
    <div className="md:flex">
      <div className="py-3">
        <select 
          name="brandId" 
          className="w-[200px] p-2 border rounded"
          value={selectedBrand}
          onChange={handleBrandChange}
        >
          <option value="">Marca...</option>
          <option value="all">All</option>
          {brands.map((brand) => (
            <option key={brand.cochesNetId} value={brand.cochesNetId}>
              {brand.label}
            </option>
          ))}
        </select>
        
      </div>
      <div className="md:p-3">
        <select name="modelId" className="w-[200px] p-2 border rounded">
          <option value="">Modelo...</option>
          <option value="all">All</option>
          {models.map((model) => (
            <option key={model.cochesComModeloId} value={model.cochesNetModeloId}>
              {model.wallapopModeloId}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};