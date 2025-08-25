import { MapContainer, TileLayer, Marker, useMap, Popup, Circle } from 'react-leaflet';
import L, { Map as LeafletMap, type ControlOptions, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { createControlComponent } from '@react-leaflet/core';
import React, { useEffect, useRef } from 'react';
import { type IProduct } from '@/types/product'; // Import IProduct from types

interface MapProps {
  userLocation: [number, number] | null; // [lng, lat]
  products: IProduct[];
  radius: number;
  center: [number, number] | null; // [lat, lng]
  selectedProductForRoute?: IProduct | null;
  onSelectForRoute: (product: IProduct | null) => void;
  mapRef?: React.RefObject<LeafletMap | null>;
}

// Custom Icons
const userIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const productIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048949.png',
  iconRetinaUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048949.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowSize: [41, 41],
});

// Routing Machine Component
interface RoutingProps extends ControlOptions {
  from: [number, number]; // [lng, lat]
  to: [number, number]; // [lng, lat]
}

const createRoutingMachineLayer = ({ from, to }: RoutingProps) => {
  const instance = (L as any).Routing.control({
    waypoints: [
      L.latLng(from[1], from[0]), // user lat, lng
      L.latLng(to[1], to[0]), // product lat, lng
    ],
    lineOptions: {
      styles: [{ color: '#2563eb', weight: 4 }],
    },
    routeWhileDragging: false,
    addWaypoints: false,
    fitSelectedRoutes: true,
    show: true,
    createMarker: () => null, // Hide default routing markers
  });

  return instance;
};

const RoutingMachine = createControlComponent(createRoutingMachineLayer);

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

const MapView = ({ userLocation, products, radius, center, selectedProductForRoute, onSelectForRoute }: MapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);

  const handleMarkerClick = (product: IProduct) => {
    if (mapRef.current) {
      mapRef.current.setView([product.location.coordinates[1], product.location.coordinates[0]], 14);
    }
  };

  if (!Array.isArray(products)) {
    return <div className="text-red-500">Error: Invalid product data</div>;
  }

  return (
    <div className="relative" style={{ height: '500px', width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={center || [27.7172, 85.324]} // Kathmandu default
        zoom={center ? 12 : 7}
        scrollWheelZoom={true}
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
            center={[userLocation[1], userLocation[0]]} // [lat, lng]
            radius={radius * 1000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#60a5fa',
              fillOpacity: 0.2,
              weight: 2,
            }}
          />
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation[1], userLocation[0]]}
            icon={userIcon}
            eventHandlers={{
              click: () => {
                if (mapRef.current) {
                  mapRef.current.setView([userLocation[1], userLocation[0]], 14);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Your Location</h3>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Product Markers */}
        {products.map((product) => {
          const isSelected = selectedProductForRoute?._id === product._id;
          return (
            <Marker
              key={product._id}
              position={[product.location.coordinates[1], product.location.coordinates[0]]}
              icon={productIcon}
              eventHandlers={{
                click: () => handleMarkerClick(product),
                mouseover: (e) => {
                  e.target.openPopup();
                },
                // mouseout: (e) => {
                //   e.target.closePopup();
                // },
              }}
            >
              <Popup>
                <div className="p-3 max-w-[250px] bg-white dark:bg-slate-800 rounded-lg shadow-md">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-32 object-cover rounded-md mb-2 hover:scale-105 transition-transform"
                    />
                  )}
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">{product.title}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{product.description}</p>
                  )}
                  {product.category && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">Category: {product.category}</p>
                  )}
                  {product.brand && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">Brand: {product.brand}</p>
                  )}
                  {product.price && (
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                      Price: NPR {product.price}
                    </p>
                  )}
                  {product.favorites && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      Favorites: {product.favorites}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    Lat: {product.location.coordinates[1].toFixed(4)}, Lng: {product.location.coordinates[0].toFixed(4)}
                  </p>
                  {userLocation && (
                    <button
                      onClick={() => onSelectForRoute(isSelected ? null : product)}
                      className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      {isSelected ? 'Clear Directions' : 'Get Directions'}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Routing */}
        {userLocation && selectedProductForRoute && (
          <RoutingMachine
            from={userLocation}
            to={selectedProductForRoute.location.coordinates}
            position="topright"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapView, (prevProps, nextProps) => {
  return (
    prevProps.userLocation === nextProps.userLocation &&
    prevProps.products === nextProps.products &&
    prevProps.radius === nextProps.radius &&
    prevProps.center === nextProps.center &&
    prevProps.selectedProductForRoute === nextProps.selectedProductForRoute
  );
});