/* eslint-disable @next/next/no-img-element */
import React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

interface Car {
  id: string;
  creationDate: string;
  title: string;
  url: string;
  price: {
    amount: number;
    financedAmount: number;
    taxTypeId: number;
    hasTaxes: boolean;
  };
  km: number;
  year: number;
  cubicCapacity: number;
  provinceIds: number[];
  mainProvince: string;
  location: {
    provinceIds: number[];
    mainProvince: string;
    mainProvinceId: number;
  };
  resources: {
    type: string;
    url: string;
  }[];
  makeId: number;
  modelId: number;
  fuelTypeId: number;
  fuelType: string;
  bodyTypeId: number;
  warranty: {
    id: number;
    months: number;
  };
  isFinanced: boolean;
  isCertified: boolean;
  isProfessional: boolean;
  publishedDate: string;
  hasUrge: boolean;
  offerType: {
    id: number;
    literal: string;
  };
  phone: string;
  environmentalLabel: string;
  drivenWheelsId: number;
  contractId: string;
  pack: {
    legacyId: number;
    type: string;
  };
  transmissionTypeId: number;
}

interface CarCardProps {
  car: Car;
}

function transmissioType(type: number) {
  switch (type) {
    case 1:
      return "Automático";
    case 2:
      return "Manual";
    case 3:
      return "Secuencial";
    case 4:
      return "CVT";
    case 5:
      return "Otros";
    default:
      return "Manual";
  }
}

const CochesNetCard: React.FC<CarCardProps> = ({ car }) => {
  const date = new Date(car.publishedDate);

  return (
    <a
      className="group block"
      href={"https://coches.net" + car.url}
      target="_blank"
      rel="noreferrer"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-cyan-900/10">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt="Car Image"
            src={
              car.resources && car.resources.length > 0
                ? car.resources[0]?.url
                : "https://via.placeholder.com/300x200"
            }
          />
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
             <img
                src="https://autoperformance.es/wp-content/uploads/2022/01/coches_net_logo.png"
                alt="Coches.net"
                className="h-3 object-contain"
              />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="line-clamp-2 text-lg font-bold leading-tight text-slate-900">
              {car.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 p-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md bg-cyan-50 px-2.5 py-0.5 text-base font-bold text-cyan-700">
                {car.price.amount.toLocaleString()} €
              </Badge>
              <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                {car.km?.toLocaleString()} km
              </Badge>
              {car.year && (
                <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {car.year}
                </Badge>
              )}
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5 opacity-80">
                 <span className="truncate">{transmissioType(car.transmissionTypeId)}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{car.fuelType}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{car.location.mainProvince}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">Hace {differenceInDays(new Date(), date)} d</span>
              </div>
            </div>
            
            <div className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-medium text-white transition-colors group-hover:bg-cyan-600">
              Ver coche
            </div>
          </CardContent>
        </div>
      </Card>
    </a>
  );
};

export default CochesNetCard;
