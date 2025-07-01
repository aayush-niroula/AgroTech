import { MapContainer, TileLayer, Marker,useMap, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { IProduct } from '@/types/product';

const ChangeMapView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, 12); // 12 is zoom level, adjust as needed
  return null;
};

// 🔧 Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  userLocation: [number, number] | null;
  products: IProduct[];
  radius: number;
  center:[number , number] | null;
}

export const MapView = ({ userLocation, products, radius ,center}: MapProps) => {
  const defaultCenter: [number, number] = userLocation || [85.324, 27.7172]; // Kathmandu fallback

  return (
     <div className="h-[400px] w-full mb-8">
      <MapContainer
        center={center || defaultCenter}
        zoom={center ? 12 : 7}
        scrollWheelZoom={false}
        className="h-full w-full rounded"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {center && <ChangeMapView center={center} />}

        {userLocation && (
          <Circle
            center={[userLocation[1], userLocation[0]]}
            radius={radius * 1000} // convert km to meters
            pathOptions={{ color: "blue", fillOpacity: 0.1 }}
          />
        )}

        {products.map((product) => (
          <Marker
            key={product._id}
            position={[product.location.coordinates[1], product.location.coordinates[0]]}
          />
        ))}
      </MapContainer>
    </div>
  );
};
