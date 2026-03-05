"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define the type for a saved search item
// Ensure this type matches the actual structure of your saved search objects
type SavedSearchItem = {
  id: number;
  name: string | null;
  brandId: string | null;
  modelId: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  kmFrom: number | null;
  kmTo: number | null;
  transmission: string | null;
  searchText: string | null;
  brandParam: string | null;
  modelParam: string | null;
  createdAt: Date; // Assuming createdAt is a Date object or string that can be parsed to Date
  userId: string;
};

export default function UserProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const utils = api.useUtils(); // For invalidating queries

  // State for saved search deletion dialog (if keeping existing logic)
  // const [searchToDelete, setSearchToDelete] = useState<SavedSearchItem | null>(null);
  // For account deletion, we can manage dialog state locally or with a simple boolean if needed.

  const {
    data: savedSearches,
    isLoading,
    error,
  } = api.savedSearch.getMySearches.useQuery(
    undefined, // no input
    {
      enabled: !!session?.user,
    },
  );

  const deleteSearchMutation = api.savedSearch.deleteSearch.useMutation({
    onSuccess: (data, variables) => {
      posthog.capture("saved_search_deleted", { search_id: variables.id });
      toast.success(data.message || "Búsqueda eliminada correctamente.");
      utils.savedSearch.getMySearches.invalidate(); // Refetch saved searches
      // setSearchToDelete(null); // Close dialog if using this state
    },
    onError: (error) => {
      posthog.captureException(new Error(error.message));
      toast.error(error.message || "Error al eliminar la búsqueda.");
      // setSearchToDelete(null); // Close dialog if using this state
    },
  });

  const deleteAccountMutation = api.user.deleteAccount.useMutation({
    onSuccess: async (data) => {
      posthog.capture("account_deleted");
      posthog.reset();
      toast.success(
        data.message || "Cuenta eliminada correctamente. Serás desconectado.",
      );
      // Sign out the user and redirect to home or login page
      await authClient.signOut();
      router.push("/");
    },
    onError: (error) => {
      posthog.captureException(new Error(error.message));
      toast.error(error.message || "Error al eliminar la cuenta.");
    },
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [isPending, session, router]);

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Cargando perfil de usuario...
      </div>
    );
  }

  if (!session) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback or if redirect hasn't happened yet:
    return (
      <div className="container mx-auto p-4 text-center">
        Redirigiendo al inicio de sesión...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error al cargar las búsquedas guardadas: {error.message}
      </div>
    );
  }

  const handleSearchClick = (
    search: SavedSearchItem,
    event?: React.MouseEvent,
  ) => {
    // Prevent navigation if the click was on the delete button area
    if (
      event &&
      (event.target as HTMLElement).closest(".delete-button-class")
    ) {
      event.stopPropagation();
      return;
    }
    posthog.capture("saved_search_clicked", {
      search_id: search.id,
      search_name: search.name || null,
      brand: search.brandParam || null,
      model: search.modelParam || null,
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
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus datos personales y tus búsquedas guardadas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600/20 to-indigo-600/20" />
            <CardContent className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-background p-1 -mt-12 mb-4 border shadow-sm">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="User avatar"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                      {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-xl mb-1">{session?.user?.name ?? "Usuario"}</h3>
                <p className="text-sm text-muted-foreground mb-6">{session?.user?.email ?? "N/A"}</p>
                
                <div className="w-full h-px bg-border/50 mb-6" />
                
                <div className="w-full flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">Estado de la cuenta</span>
                  <span className="font-medium text-green-600 inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Activa
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Gestión de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Cuenta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar cuenta permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán permanentemente tus datos y alertas de correo asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAccountMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sí, eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tus Búsquedas Guardadas</h2>
            <span className="text-sm text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {savedSearches?.length || 0} {(savedSearches?.length === 1) ? 'búsqueda' : 'búsquedas'}
            </span>
          </div>
          
          {savedSearches && savedSearches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {savedSearches.map((search) => (
                <AlertDialog key={`alert-${search.id}`}>
                  <Card className="border-border/50 shadow-sm overflow-hidden group">
                    <div
                      className="cursor-pointer block transition-colors hover:bg-muted/30"
                      onClick={(e) => handleSearchClick(search, e)}
                    >
                      <div className="p-5 flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg text-foreground group-hover:text-blue-600 transition-colors">
                            {search.name ||
                              `${search.brandParam || 'Vehículos'} ${search.modelParam || ''}`.trim() || `Búsqueda Guardada`}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {search.brandParam && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                {search.brandParam}
                              </span>
                            )}
                            {search.modelParam && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                {search.modelParam}
                              </span>
                            )}
                            {(search.priceFrom || search.priceTo) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                                {search.priceFrom ? `${search.priceFrom}€` : '0€'} - {search.priceTo ? `${search.priceTo}€` : 'Max'}
                              </span>
                            )}
                            {(search.yearFrom || search.yearTo) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">
                                {search.yearFrom || 'Min'} - {search.yearTo || 'Max'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            Guardada el {new Date(search.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between h-full space-y-4">
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="delete-button-class h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Eliminar</span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <Button variant="ghost" size="sm" className="hidden group-hover:flex h-8 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            Ver resultados
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar búsqueda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ya no te notificaremos cuando haya nuevos resultados para <strong>{search.name || `${search.brandParam || ''} ${search.modelParam || ''}`.trim() || 'esta búsqueda'}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mantener</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSearchMutation.mutate({ id: search.id })}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </Card>
                </AlertDialog>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border/60">
              <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No tienes búsquedas</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Guarda tus búsquedas para recibir notificaciones por correo electrónico cuando haya nuevos vehículos.
              </p>
              <Button onClick={() => router.push('/search')} variant="default">
                Explorar coches
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
