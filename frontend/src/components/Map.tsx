import { MapContainer, TileLayer, Marker, useMap, Popup, Circle } from 'react-leaflet';
import L, { Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

interface Location {
  coordinates: [number, number];
}

interface Product {
  _id: string;
  title: string;
  location: Location;
  description?: string;
  imageUrl?: string;
  price?: number;
  brand?: string;
  category?: string;
}

interface MapProps {
  userLocation: [number, number] | null;
  products: Product[];
  radius: number;
  center: [number, number] | null;
   mapRef?: React.RefObject<LeafletMap | null>;
}

// Initialize Leaflet default icons
const initializeLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

// Component to update map view when center changes
const ChangeMapView = ({
  center,
  mapRef,
}: {
  center: [number, number];
  mapRef: React.RefObject<LeafletMap | null>;
}) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 12);
      if (mapRef.current !== map) {
        mapRef.current = map;
      }
      map.invalidateSize();
    }
  }, [center, map, mapRef]);

  return null;
};

const MapView = ({ userLocation, products, radius, center }: MapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    initializeLeafletIcons();
  }, []);

  const defaultCenter: [number, number] = [27.7172, 85.324]; // Kathmandu

  if (!Array.isArray(products)) {
    return <div className="text-red-500">Error: Invalid product data</div>;
  }

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={center || defaultCenter}
        zoom={center ? 12 : 7}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Update center dynamically */}
        {center && <ChangeMapView center={center} mapRef={mapRef} />}

        {/* User Location Circle */}
        {userLocation && (
          <Circle
            center={[userLocation[1], userLocation[0]]}
            radius={radius * 1000}
            pathOptions={{
              color: 'blue',
              fillColor: 'blue',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* Product Markers */}
        {products.map((product) => (
          <Marker
            key={product._id}
            position={[
              product.location.coordinates[1], // lat
              product.location.coordinates[0], // lng
            ]}
          >
            <Popup>
              <div className="p-2 max-w-[200px]">
                <h3 className="font-bold text-sm">{product.title}</h3>
                {product.description && (
                  <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                )}
                {product.price && (
                  <p className="text-xs text-gray-800 mt-1">Price: ${product.price}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {product.location.coordinates[1].toFixed(4)},
                  Lng: {product.location.coordinates[0].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Prevent unnecessary re-renders
export default React.memo(MapView, (prevProps, nextProps) => {
  return (
    prevProps.userLocation === nextProps.userLocation &&
    prevProps.products === nextProps.products &&
    prevProps.radius === nextProps.radius &&
    prevProps.center === nextProps.center
  );
});