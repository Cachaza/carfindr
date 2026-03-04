"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import posthog from "posthog-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { type savedSearches } from "@/server/db/schema"; // Assuming this is the correct type import

type SavedSearch = typeof savedSearches.$inferSelect; // Infer type from schema

export function RecentSearchesCard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const {
    data: recentSearches,
    isLoading,
    error,
  } = api.savedSearch.getMySearches.useQuery(
    { limit: 5 }, // Fetch top 5
    {
      enabled: !!session?.user,
    },
  );

  if (isPending) {
    return null;
  }

  if (!session || !recentSearches || recentSearches.length === 0) {
    return null; // Don't render anything if not logged in or no recent searches
  }

  if (isLoading) {
    return (
      <Card className="panel-glass mt-8 border-white/70">
        <CardHeader>
          <CardTitle>Búsquedas guardadas recientes</CardTitle>
          <CardDescription>Tus últimas 5 búsquedas guardadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Cargando búsquedas recientes...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error al cargar búsquedas guardadas:", error.message);
    return (
      <Card className="panel-glass mt-8 border-white/70">
        <CardHeader>
          <CardTitle>Búsquedas guardadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            No se pudieron cargar tus búsquedas guardadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSearchClick = (search: SavedSearch) => {
    posthog.capture("saved_search_clicked", {
      search_id: search.id,
      search_name: search.name || null,
      brand: search.brandParam || null,
      model: search.modelParam || null,
      source: "recent_searches_card",
    });
    const params = new URLSearchParams();
    if (search.brandId) params.append("brandId", search.brandId);
    if (search.modelId) params.append("modelId", search.modelId);
    if (search.yearFrom) params.append("yearFrom", search.yearFrom.toString());
    if (search.yearTo) params.append("yearTo", search.yearTo.toString());
    if (search.priceFrom)
      params.append("priceFrom", search.priceFrom.toString());
    if (search.priceTo) params.append("priceTo", search.priceTo.toString());
    if (search.kmFrom) params.append("kmFrom", search.kmFrom.toString());
    if (search.kmTo) params.append("kmTo", search.kmTo.toString());
    if (search.transmission) params.append("transmision", search.transmission);
    if (search.searchText) params.append("searchText", search.searchText);
    if (search.brandParam) params.append("brand", search.brandParam);
    if (search.modelParam) params.append("model", search.modelParam);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <Card className="panel-glass mt-8 border-white/70">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">
          Busquedas guardadas recientes
        </CardTitle>
        <CardDescription>
          Tus últimas 5 búsquedas guardadas. Haz clic en una fila para cargar la
          búsqueda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-right">Guardada el</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSearches.map((search) => (
              <TableRow
                key={search.id}
                onClick={() => handleSearchClick(search)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  {search.name || "Búsqueda sin nombre"}
                </TableCell>
                <TableCell>{search.brandParam || "-"}</TableCell>
                <TableCell>{search.modelParam || "-"}</TableCell>
                <TableCell className="text-right">
                  {new Date(search.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
