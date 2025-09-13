import ProtectedRoute from "@/components/ProtectedRoot";

export default function DvdPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-8">
                <h1 className="text-4xl font-bold mb-4">Ma collection de DVD</h1>
                <p className="text-lg">Bienvenue sur la page de votre collection de DVD. Seuls les utilisateurs connectés peuvent voir ceci.</p>
                {/* Vous ajouterez ici la logique pour afficher votre collection */}
            </div>
        </ProtectedRoute>
    )
}
