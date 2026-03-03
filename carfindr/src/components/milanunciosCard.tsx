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
      className="group block px-1 py-2"
      href={`https://www.milanuncios.com${car.url}`}
      target="_blank"
      rel="noreferrer"
    >
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/90 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-cyan-900/10 md:flex md:w-full md:flex-row">
        <div className="md:w-1/3">
          <img
            alt="Car Image"
            src={
              car.photo.length > 0
                ? "https://" + car.photo[0] + "?rule=detail_640x480"
                : "https://via.placeholder.com/640x480"
            }
            style={{
              objectFit: "cover",
            }}
            className="h-52 w-full md:h-full"
          />
        </div>
        <div className="flex flex-col justify-between md:w-2/3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-slate-900">
                {getAttributeValue("year")} {car.title}
              </CardTitle>
              <img
                src="https://www.milanuncios.com/prensa//wp-content/uploads/2020/11/M-Icon-Round.png"
                alt="milanuncios logo"
                className="h-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="rounded-full bg-cyan-50 text-cyan-700">{car.price.cash.label}</Badge>
                  <Badge variant="default" className="rounded-full bg-slate-800 text-white">
                    {getAttributeValue("kilometers")}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-slate-600">
                <p>
                  {capitalizeFirstLetter(
                    getAttributeValue("transmission") ?? "",
                  )}
                </p>
                <p>{car.location.province.name}</p>
                <p>Hace {differenceInDays(new Date(), date)} dias</p>
                <p>{capitalizeFirstLetter(getAttributeValue("fuel") ?? "")}</p>
              </div>
              <p className="text-sm text-slate-600">{car.description.slice(0, 100)}...</p>
            </div>
          </CardContent>
        </div>
      </Card>
    </a>
  );
};

export default MilanunciosCard;
