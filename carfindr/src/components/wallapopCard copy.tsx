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
      return "Desconocido";
    } else {
      return tipo;
    }
  }

  return (
    <a
      className="px-3 overflow-hidden"
      href={`https://es.wallapop.com/item/${car.content.web_slug}`}
      target="_blank"
    >
      <Card className="flex w-full flex-col md:w-[700px] md:flex-row">
        <div className="md:w-1/3 overflow-clip">
          <img
            alt="Car Image"
            src={
              car.content.images && car.content.images.length > 0
                ? car.content.images[0]?.original
                : "https://via.placeholder.com/300x200"
            }
            style={{
              objectFit: "cover",
            }}
          />
        </div>
        <div className="flex flex-col justify-between md:w-2/3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {car.content.year} {car.content.title}
              </CardTitle>
              <img
                src="https://i0.wp.com/about.wallapop.com/wp-content/uploads/2021/07/brand-motion.png?fit=690%2C690&ssl=1"
                alt=""
                className="h-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {car.content.price.toLocaleString()} {car.content.currency}
                  </Badge>
                  <Badge variant="default">
                    {car.content.km?.toLocaleString()}km
                  </Badge>
                </div>
              </div>
              <div className="text-m grid grid-cols-2">
                <p>{tipoTransmision(car.content.gearbox)}</p>
                <p>{car.content.location.city}</p>
                <p>Hace {differenceInDays(new Date(), date)} días</p>
                <p>{car.content.engine}</p>
              </div>
              <p>{car.content.storytelling.slice(0, 97)}...</p>
            </div>
          </CardContent>
        </div>
      </Card>
    </a>
  );
};

export default WallapopCard;
