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
      className="group block px-1 py-2"
      href={"https://coches.net" + car.url}
      target="_blank"
      rel="noreferrer"
    >
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/90 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-cyan-900/10 md:flex md:w-full md:flex-row">
        <div className="md:w-1/3">
          <img
            className="h-52 w-full object-cover md:h-full"
            alt="Car Image"
            src={
              car.resources && car.resources.length > 0
                ? car.resources[0]?.url
                : "https://via.placeholder.com/300x200"
            }
          />
        </div>
        <div className="flex flex-col justify-between md:w-2/3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-slate-900">
                {car.year} {car.title}
              </CardTitle>
              <img
                src="https://autoperformance.es/wp-content/uploads/2022/01/coches_net_logo.png"
                alt=""
                className="h-4"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="rounded-full bg-cyan-50 text-cyan-700">
                    {car.price.amount.toLocaleString()} €
                  </Badge>
                  <Badge variant="default" className="rounded-full bg-slate-800 text-white">
                    {car.km?.toLocaleString()} km
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-slate-600">
                <p>{transmissioType(car.transmissionTypeId)}</p>
                <p>{car.location.mainProvince}</p>
                <p>Hace {differenceInDays(new Date(), date)} dias</p>
                <p>{car.fuelType}</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </a>
  );
};

export default CochesNetCard;
