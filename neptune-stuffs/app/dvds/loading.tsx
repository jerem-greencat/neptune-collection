export default function LoadingDvds() {
	return (
		<div className="container mx-auto px-4 py-6 sm:p-8 animate-pulse">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold mb-6">
					Ma Collection de Dvds
				</h1>
				<div className="h-10 w-40 bg-gray-200 rounded mb-6" />
			</div>

			<div className="h-10 w-full bg-gray-200 rounded mb-6" />

			<ul className="space-y-4">
				{[0, 1, 2].map((index) => (
					<li
						key={index}
						className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-3"
					>
						<div className="h-6 w-1/2 bg-gray-200 rounded" />
						<div className="h-6 w-24 bg-gray-200 rounded shrink-0" />
					</li>
				))}
			</ul>

			<span className="sr-only">Chargement de la collection…</span>
		</div>
	);
}
