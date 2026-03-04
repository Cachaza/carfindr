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
import { Trash2, Download } from "lucide-react";
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

  const requestDataReportMutation = api.user.requestDataReport.useMutation({
    onSuccess: (data) => {
      posthog.capture("data_report_requested");
      toast.success(
        data.message ||
          "Informe de datos solicitado. Revisa tu correo electronico.",
      );
    },
    onError: (error) => {
      posthog.captureException(new Error(error.message));
      toast.error(error.message || "Error al solicitar el informe de datos.");
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
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Perfil:</CardTitle>
          <CardDescription>
            Aqui puedes ver tus ajustes de cuenta y busquedas guardadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session?.user && (
            <div className="flex items-center justify-between">
              <div>
                <p>
                  <strong>Nombre:</strong> {session.user.name ?? "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email ?? "N/A"}
                </p>
              </div>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="User avatar"
                  className="ml-4 h-20 w-20 rounded-full object-cover"
                />
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 p-6 pt-0 md:flex-row md:space-x-2 md:space-y-0">
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => requestDataReportMutation.mutate()}
            disabled={requestDataReportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {requestDataReportMutation.isPending
              ? "Solicitando..."
              : "Solicitar Informe de Datos"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full md:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Estás absolutamente seguro?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará
                  permanentemente tu cuenta y todos tus datos asociados,
                  incluidas las búsquedas guardadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteAccountMutation.mutate();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sí, eliminar mi cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <h2 className="mb-4 text-2xl font-semibold">Búsquedas guardadas:</h2>
      {savedSearches && savedSearches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedSearches.map((search) => (
            <AlertDialog key={`alert-${search.id}`}>
              <Card className="relative hover:shadow-lg">
                <div
                  className="cursor-pointer p-4"
                  onClick={(e) => handleSearchClick(search, e)}
                >
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">
                      {search.name ||
                        `Búsqueda del ${new Date(search.createdAt).toLocaleDateString()}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-gray-600">
                      {search.brandParam && `Marca: ${search.brandParam}`}
                      {search.modelParam && `, Modelo: ${search.modelParam}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Guardada el: {new Date(search.createdAt).toLocaleString()}
                    </p>
                  </CardContent>
                </div>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="delete-button-class absolute right-2 top-2"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  {" "}
                  {/* This is for deleting a single search */}
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Eliminar esta búsqueda guardada?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará
                      permanentemente tu búsqueda guardada: <br />
                      <strong>
                        {search.name ||
                          `Búsqueda del ${new Date(search.createdAt).toLocaleDateString()}`}
                      </strong>
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteSearchMutation.mutate({ id: search.id });
                      }}
                      className="bg-red-600 hover:bg-red-700"
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
        <p>Aún no tienes búsquedas guardadas.</p>
      )}
      {/* Removed the single AlertDialog from here as it's now per item */}
    </div>
  );
}
