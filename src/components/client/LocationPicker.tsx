import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { haversineKm, calcDeliveryFee } from '@/lib/haversine';
import { fmtPrice } from '@/lib/utils';
import type { DeliverySettings, LocationData } from '@/types';
import styles from './LocationPicker.module.css';

const DEFAULT_CENTER = { lat: 10.3910, lng: -75.4794 };

interface Props {
  onChange: (data: LocationData) => void;
}

// ─── Inner: solo se monta cuando Maps ya está cargado ────────────────────────
function LocationPickerInner({ onChange, deliverySettings }: {
  onChange: Props['onChange'];
  deliverySettings: DeliverySettings | null;
}) {
  const mapRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInst  = useRef<any>(null);
  const tokenRef = useRef<any>(null);

  const [lat,        setLat]        = useState<number | null>(null);
  const [lng,        setLng]        = useState<number | null>(null);
  const [address,    setAddress]    = useState('');
  const [notes,      setNotes]      = useState('');
  const [geoError,   setGeoError]   = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Notifica hacia afuera cada vez que cambia posición, notas o settings
  useEffect(() => {
    if (lat === null || lng === null) return;
    let distance_km = 0;
    let delivery_fee = 0;
    if (deliverySettings?.origin_lat) {
      const raw = haversineKm(lat, lng, deliverySettings.origin_lat, deliverySettings.origin_lng);
      distance_km  = Math.round(raw * 10) / 10;
      delivery_fee = calcDeliveryFee(distance_km, deliverySettings.price_per_km, deliverySettings.min_delivery_fee);
    }
    onChangeRef.current({ lat, lng, address, notes, distance_km, delivery_fee });
  }, [lat, lng, address, notes, deliverySettings]);

  const applyCenter = useCallback((latLng: any) => {
    const newLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const newLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
    setLat(newLat);
    setLng(newLng);
  }, []);

  // Inicializa mapa y autocomplete (solo al montar)
  useEffect(() => {
    if (!mapRef.current || !inputRef.current) return;

    const gm = (window as any).google.maps;

    const map = new gm.Map(mapRef.current, {
      center:           DEFAULT_CENTER,
      zoom:             13,
      disableDefaultUI: true,
      zoomControl:      true,
      clickableIcons:   false,
      gestureHandling:  'greedy', // un dedo en móvil, scroll en pc
    });
    mapInst.current = map;

    // Pin fijo: lee el centro cuando el mapa termina de moverse
    // Salta el primer idle (render inicial) para no marcar coordenadas sin que el usuario haya interactuado
    let firstIdle = true;
    map.addListener('idle', () => {
      if (firstIdle) { firstIdle = false; return; }
      applyCenter(map.getCenter());
    });

    // Autocomplete con session token
    tokenRef.current = new gm.places.AutocompleteSessionToken();
    const ac = new gm.places.Autocomplete(inputRef.current!, {
      componentRestrictions: { country: 'co' },
      fields: ['geometry', 'formatted_address'],
      sessionToken: tokenRef.current,
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      setAddress(place.formatted_address ?? '');
      map.setCenter(place.geometry.location);
      map.setZoom(16);
      // idle se dispara después y registra las coordenadas
      tokenRef.current = new gm.places.AutocompleteSessionToken();
    });

    return () => {
      gm.event.clearInstanceListeners(map);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geolocalización
  function handleGeolocate() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const gm = (window as any).google.maps;
        mapInst.current?.setCenter(new gm.LatLng(latitude, longitude));
        mapInst.current?.setZoom(16);
        // idle se dispara después y registra las coordenadas
        setGeoLoading(false);
      },
      err => {
        const msgs: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Actívalo en la configuración del navegador.',
          2: 'No se pudo determinar tu ubicación.',
          3: 'La solicitud de ubicación tardó demasiado.',
        };
        setGeoError(msgs[err.code] ?? 'Error de geolocalización.');
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // Cálculo para el resumen visual
  const distance_km = (lat !== null && lng !== null && deliverySettings?.origin_lat)
    ? Math.round(haversineKm(lat, lng, deliverySettings.origin_lat, deliverySettings.origin_lng) * 10) / 10
    : null;
  const delivery_fee = (distance_km !== null && deliverySettings)
    ? calcDeliveryFee(distance_km, deliverySettings.price_per_km, deliverySettings.min_delivery_fee)
    : null;

  return (
    <div className={styles.wrap}>

      {/* Búsqueda con autocomplete */}
      <div className={styles.searchWrap}>
        <MapPin size={15} className={styles.searchIcon} />
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="Busca tu dirección…"
          type="text"
        />
      </div>

      {/* Mapa con pin fijo en el centro */}
      <div className={styles.mapWrap}>
        <div ref={mapRef} className={styles.mapContainer} />
        <div className={styles.centerPin}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#FF6229"/>
            <circle cx="16" cy="16" r="6" fill="#fff"/>
          </svg>
        </div>
      </div>

      {/* Geolocalización */}
      <div>
        <button
          type="button"
          className={styles.geoBtn}
          onClick={handleGeolocate}
          disabled={geoLoading}
        >
          {geoLoading
            ? <Loader size={14} className={styles.spin} />
            : <Navigation size={14} />
          }
          {geoLoading ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
        </button>
        {geoError && <div className={styles.geoErrBox} style={{ marginTop: 8 }}>{geoError}</div>}
      </div>

      {/* Notas adicionales */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Indicaciones adicionales
        </div>
        <textarea
          className={styles.notesInput}
          rows={2}
          placeholder="Apto, piso, color de puerta, referencias del lugar…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Resumen de tarifa */}
      <div className={styles.feeBox}>
        <div className={styles.feeLeft}>
          <span className={styles.feeLabel}>Domicilio</span>
          {distance_km !== null
            ? <span className={styles.feeDist}>{distance_km} km desde nuestro centro</span>
            : <span className={styles.feeDist}>Mueve el mapa para calcular</span>
          }
        </div>
        {delivery_fee !== null
          ? <span className={styles.feeValue}>{fmtPrice(delivery_fee)}</span>
          : deliverySettings
            ? <span className={styles.feeValue} style={{ fontSize: 14 }}>—</span>
            : <span className={styles.feeUnconfigured}>Tarifa no disponible aún</span>
        }
      </div>
    </div>
  );
}

// ─── Wrapper público: maneja carga de Maps + delivery_settings ───────────────
export function LocationPicker({ onChange }: Props) {
  const [mapsLoaded,       setMapsLoaded]       = useState(false);
  const [mapsError,        setMapsError]        = useState('');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [settingsLoading,  setSettingsLoading]  = useState(true);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch(e  => setMapsError(e.message ?? 'Error cargando Google Maps'));
  }, []);

  useEffect(() => {
    getDoc(doc(db, 'config', 'delivery_settings'))
      .then(snap => { if (snap.exists()) setDeliverySettings(snap.data() as DeliverySettings); })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  if (mapsError) {
    return (
      <div className={styles.errBox}>
        No se pudo cargar el mapa. Verifica tu conexión e intenta de nuevo.
        {mapsError.includes('API_KEY') && (
          <> El administrador debe configurar la clave de Google Maps.</>
        )}
      </div>
    );
  }

  if (!mapsLoaded || settingsLoading) {
    return (
      <div className={styles.skeleton}>
        <Loader size={18} className={styles.spin} />
        Cargando mapa…
      </div>
    );
  }

  return <LocationPickerInner onChange={onChange} deliverySettings={deliverySettings} />;
}
