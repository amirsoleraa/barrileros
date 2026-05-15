// Singleton loader — evita cargar el script más de una vez aunque el componente
// se monte y desmonte varias veces.
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));

  // Ya cargado
  const g = (window as any).google;
  if (g?.maps?.places) return Promise.resolve();

  // Carga en progreso
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (!key) {
      loadPromise = null;
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('No se pudo cargar Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
