// components/Map.tsx

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { IProduct } from '@/types/product';


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
}

export const MapView = ({ userLocation, products, radius }: MapProps) => {
  const defaultCenter: [number, number] = userLocation || [85.324, 27.7172]; // Kathmandu fallback

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border">
      <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🔵 User Location Marker */}
        {userLocation && (
          <>
            <Marker position={[userLocation[1], userLocation[0]]}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle
              center={[userLocation[1], userLocation[0]]}
              radius={radius * 1000}
              pathOptions={{ fillColor: 'blue', color: 'blue', fillOpacity: 0.2 }}
            />
          </>
        )}

        {/* 📍 Product Markers */}
        {products.map((product) => (
          <Marker
            key={product._id}
            position={[product.location.coordinates[1], product.location.coordinates[0]]}
          >
            <Popup>
              <div className="font-bold">{product.title}</div>
              <div>{product.price} USD</div>
              <div className="text-xs">{product.sellerId.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
