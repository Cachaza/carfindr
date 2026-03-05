/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { differenceInDays } from "date-fns";

interface CarImage {
  original: string;
}

interface CarContent {
  id: string;
  title: string;
  storytelling: string;
  distance: number;
  images: CarImage[];
  price: number;
  currency: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  gearbox: string;
  engine: string;
  location: {
    postal_code: string;
    country_code: string;
    city: string;
  };
  creation_date: number;
  modification_date: number;
  web_slug: string;
}

interface Car {
  id: string;
  type: string;
  content: CarContent;
}

interface CarCardProps {
  car: Car;
}

const WallapopCard: React.FC<CarCardProps> = ({ car }) => {
  const date = new Date(car.content.creation_date);

  function tipoTransmision(tipo: string) {
    if (tipo === "manual") {
      return "Manual";
    } else if (tipo === "automatic") {
      return "Automático";
    } else if (tipo === "") {
      return "No especificado";
    } else {
      return tipo;
    }
  }

  return (
    <a
      className="group block"
      href={`https://es.wallapop.com/item/${car.content.web_slug}`}
      target="_blank"
      rel="noreferrer"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-cyan-900/10">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            alt="Car Image"
            src={
              car.content.images && car.content.images.length > 0
                ? car.content.images[0]?.original
                : "https://via.placeholder.com/300x200"
            }
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm flex items-center justify-center">
            <img
              src="https://i0.wp.com/about.wallapop.com/wp-content/uploads/2021/07/brand-motion.png?fit=690%2C690&ssl=1"
              alt="Wallapop"
              className="h-4 object-contain"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="line-clamp-2 text-lg font-bold leading-tight text-slate-900">
              {car.content.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 p-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md bg-cyan-50 px-2.5 py-0.5 text-base font-bold text-cyan-700">
                {car.content.price.toLocaleString()} {car.content.currency}
              </Badge>
              {car.content.km !== undefined && (
                <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {car.content.km?.toLocaleString()} km
                </Badge>
              )}
              {car.content.year && (
                <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {car.content.year}
                </Badge>
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{tipoTransmision(car.content.gearbox)}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{car.content.engine}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{car.content.location.city}</span>
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

export default WallapopCard;
