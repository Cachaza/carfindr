/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

interface MilanunciosCarAttributes {
  field: {
    formatted: string;
    raw: string;
  };
  value: {
    formatted: string;
    raw: string;
  };
}

interface MilanunciosCarLocation {
  city: {
    id: number;
    name: string;
    slug: string;
  };
  province: {
    id: number;
    name: string;
    slug: string;
  };
  region: {
    id: number;
    name: string;
    slug: string;
  };
}

interface MilanunciosCarPrice {
  cash: {
    includeTaxes: boolean;
    label: string;
    value: number;
  };
}

interface MilanunciosCar {
  attributes: MilanunciosCarAttributes[];
  location: MilanunciosCarLocation;
  price: MilanunciosCarPrice;
  title: string;
  description: string;
  publicationDate: string;
  url: string;
  photo: string[];
}

interface MilanunciosCardProps {
  car: MilanunciosCar;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const MilanunciosCard: React.FC<MilanunciosCardProps> = ({ car }) => {
  const date = new Date(car.publicationDate);

  const getAttributeValue = (attributeKey: string): string | undefined => {
    const attribute = car.attributes.find(
      (attr) => attr.field.raw === attributeKey,
    );
    return attribute?.value.formatted;
  };

  return (
    <a
      className="group block"
      href={`https://www.milanuncios.com${car.url}`}
      target="_blank"
      rel="noreferrer"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-cyan-900/10">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            alt="Car Image"
            src={
              car.photo.length > 0
                ? "https://" + car.photo[0] + "?rule=detail_640x480"
                : "https://via.placeholder.com/640x480"
            }
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
            <img
              src="https://www.milanuncios.com/prensa//wp-content/uploads/2020/11/M-Icon-Round.png"
              alt="Milanuncios"
              className="h-4 object-contain"
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
                {car.price.cash.label}
              </Badge>
              {getAttributeValue("kilometers") && (
                <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {getAttributeValue("kilometers")}
                </Badge>
              )}
              {getAttributeValue("year") && (
                <Badge variant="default" className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {getAttributeValue("year")}
                </Badge>
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">
                  {capitalizeFirstLetter(getAttributeValue("transmission") ?? "")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">
                  {capitalizeFirstLetter(getAttributeValue("fuel") ?? "")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="truncate">{car.location.province.name}</span>
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

export default MilanunciosCard;
