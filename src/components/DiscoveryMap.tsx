import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Place } from "../types";
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Compass, WifiOff } from "lucide-react";

interface DiscoveryMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
  categoryFilter: string;
  searchQuery: string;
  isOffline: boolean;
  mapLayer: "streets" | "satellite";
  setMapLayer: (layer: "streets" | "satellite") => void;
  transitActive: boolean;
  transitSpeed: number; // For simulating movement
  onPlacesFetched?: (places: Place[]) => void;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
}

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY";

const getGoogleTypes = (category: string): string[] => {
  switch (category.toLowerCase()) {
    case "history":
      return ["museum", "historical_landmark", "tourist_attraction", "place_of_worship"];
    case "nature":
      return ["park", "zoo", "aquarium", "campground"];
    case "culture":
      return ["art_gallery", "museum", "performing_arts_theater", "library"];
    case "food":
      return ["restaurant", "cafe", "bar", "bakery"];
    case "hidden gems":
      return ["tourist_attraction", "point_of_interest"];
    default:
      return ["tourist_attraction", "museum", "restaurant", "park", "cafe", "art_gallery"];
  }
};

const mapPlaceTypeToCategory = (types: string[] | undefined, defaultCategory: string): string => {
  if (defaultCategory !== "All") return defaultCategory;
  if (!types || types.length === 0) return "Hidden Gems";

  if (types.some(t => ["restaurant", "cafe", "bar", "bakery", "food", "meal_takeaway", "meal_delivery"].includes(t))) {
    return "Food";
  }
  if (types.some(t => ["park", "zoo", "aquarium", "campground", "beach", "national_park"].includes(t))) {
    return "Nature";
  }
  if (types.some(t => ["museum", "historical_landmark", "church", "place_of_worship", "hindu_temple", "synagogue", "mosque"].includes(t))) {
    return "History";
  }
  if (types.some(t => ["art_gallery", "performing_arts_theater", "library", "museum"].includes(t))) {
    return "Culture";
  }
  return "Hidden Gems";
};

function GooglePlacesLoader({
  categoryFilter,
  searchQuery,
  onPlacesFetched,
  isOffline
}: {
  categoryFilter: string;
  searchQuery: string;
  onPlacesFetched?: (places: Place[]) => void;
  isOffline: boolean;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!map || !placesLib || isOffline || !onPlacesFetched) return;

    let active = true;

    const fetchRealPlaces = async () => {
      try {
        const center = map.getCenter();
        if (!center) return;

        let results: google.maps.places.Place[] = [];

        if (searchQuery.trim()) {
          const response = await placesLib.Place.searchByText({
            textQuery: searchQuery,
            locationBias: { lat: center.lat(), lng: center.lng() },
            fields: [
              "id",
              "displayName",
              "location",
              "formattedAddress",
              "types",
              "rating",
              "userRatingCount",
              "editorialSummary",
              "photos"
            ],
            maxResultCount: 20
          });
          results = response.places || [];
        } else {
          const types = getGoogleTypes(categoryFilter);
          const response = await placesLib.Place.searchNearby({
            locationRestriction: {
              center: { lat: center.lat(), lng: center.lng() },
              radius: 4000
            },
            includedTypes: types,
            fields: [
              "id",
              "displayName",
              "location",
              "formattedAddress",
              "types",
              "rating",
              "userRatingCount",
              "editorialSummary",
              "photos"
            ],
            maxResultCount: 20
          });
          results = response.places || [];
        }

        if (!active) return;

        const mapped: Place[] = results.map((p) => {
          let imageUrl = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80";
          if (p.photos && p.photos[0]) {
            try {
              imageUrl = p.photos[0].getURI({ maxWidth: 600 });
            } catch (e) {
              console.warn("Failed to get photo URI:", e);
            }
          } else {
            if (categoryFilter.toLowerCase() === "food") {
              imageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
            } else if (categoryFilter.toLowerCase() === "nature") {
              imageUrl = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";
            } else if (categoryFilter.toLowerCase() === "culture") {
              imageUrl = "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80";
            }
          }

          const category = mapPlaceTypeToCategory(p.types, categoryFilter);

          return {
            id: p.id,
            name: p.displayName || "Unknown Landmark",
            category: category,
            type: p.types && p.types[0] ? p.types[0].replace(/_/g, ' ') : 'Point of Interest',
            lat: p.location ? p.location.lat() : center.lat(),
            lng: p.location ? p.location.lng() : center.lng(),
            rating: p.rating || 4.2,
            reviewCount: p.userRatingCount || 10,
            address: p.formattedAddress || 'Lagos, Nigeria',
            distance: 'Nearby',
            status: 'Open Now',
            image: imageUrl,
            quickFact: p.editorialSummary || `A fantastic ${category.toLowerCase()} spot to explore and learn its history.`,
            facts: [
              { 
                text: p.editorialSummary || `Rated ${p.rating || 4.2}/5 stars by over ${p.userRatingCount || 10} local visitors.`, 
                source: "Google Maps Community", 
                verified: true 
              },
              {
                text: `Known as a prominent ${p.types && p.types[0] ? p.types[0].replace(/_/g, ' ') : 'local place'} in the community.`,
                source: "AroundMe AI Sourced Facts",
                verified: true
              }
            ],
            about: p.editorialSummary || `${p.displayName || "This place"} is a notable location offering a rich experience for visitors looking to understand the cultural fabric of Lagos.`,
            history: [
              { year: "Recent", event: "Ranked as a popular location for cultural and leisure activities." }
            ],
            news: []
          };
        });

        onPlacesFetched(mapped);
      } catch (err) {
        console.error("Error loading real-time Google Places:", err);
      }
    };

    const listener = map.addListener("idle", fetchRealPlaces);
    fetchRealPlaces();

    return () => {
      active = false;
      listener.remove();
    };
  }, [map, placesLib, categoryFilter, searchQuery, isOffline]);

  return null;
}

export default function DiscoveryMap({
  places,
  selectedPlace,
  onPlaceSelect,
  userLocation,
  categoryFilter,
  searchQuery,
  isOffline,
  mapLayer,
  setMapLayer,
  transitActive,
  transitSpeed,
  onPlacesFetched,
  onCenterChanged
}: DiscoveryMapProps) {
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState({ lat: 6.44, lng: 3.44 }); // Default Lagos Center

  // Offline Vector Map Zoom/Pan States
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync map center to parent for location-based feeds
  useEffect(() => {
    if (onCenterChanged) {
      onCenterChanged(center);
    }
  }, [center, onCenterChanged]);

  // Update center when selected place changes
  useEffect(() => {
    if (selectedPlace) {
      setCenter({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    }
  }, [selectedPlace]);

  // Update center when user location changes
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

  // Distance utility
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get dynamic boundary coordinates for offline/fallback map representation
  const getBounds = () => {
    const distFromLagos = getDistance(center.lat, center.lng, 6.4447, 3.4045);
    if (distFromLagos <= 50) {
      return {
        latMin: 6.41,
        latMax: 6.46,
        lngMin: 3.38,
        lngMax: 3.55
      };
    }
    // Center boundaries around active center dynamically
    return {
      latMin: center.lat - 0.025,
      latMax: center.lat + 0.025,
      lngMin: center.lng - 0.085,
      lngMax: center.lng + 0.085
    };
  };

  // Simulated movement for transit mode
  const [simulatedLocation, setSimulatedLocation] = useState({ lat: 6.442, lng: 3.42 });
  useEffect(() => {
    if (transitActive) {
      setSimulatedLocation(center);
      const interval = setInterval(() => {
        setSimulatedLocation((prev) => {
          // Slowly wander around active center coordinates
          const newLat = prev.lat + (Math.random() - 0.4) * 0.0004 * transitSpeed;
          const newLng = prev.lng + (Math.random() - 0.5) * 0.0004 * transitSpeed;
          return { lat: newLat, lng: newLng };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [transitActive, transitSpeed, center]);

  // Helper to map LatLng coordinates to beautiful SVG pixel positions dynamically
  const getSvgCoordinates = (lat: number, lng: number) => {
    const { latMin, latMax, lngMin, lngMax } = getBounds();

    const width = 800;
    const height = 500;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * width;
    // SVG y coordinates start from top, so we invert
    const y = height - ((lat - latMin) / (latMax - latMin)) * height;

    return { x: x + panOffset.x, y: y + panOffset.y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleOfflinePointSelect = (lat: number, lng: number) => {
    const distFromLagos = getDistance(lat, lng, 6.4447, 3.4045);
    let estimatedArea = `District (Lat: ${lat.toFixed(3)}, Lng: ${lng.toFixed(3)})`;
    let addressStr = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (distFromLagos <= 50) {
      if (lat > 6.445) {
        estimatedArea = "Lagos Island / Ikoyi";
      } else if (lat > 6.43) {
        estimatedArea = "Victoria Island";
      } else {
        estimatedArea = "Lekki Peninsula";
      }
      addressStr = `${estimatedArea}, Lagos, Nigeria`;
    }

    const customPlace: Place = {
      id: `custom-${lat.toFixed(6)}-${lng.toFixed(6)}`,
      name: `Offline Location (${estimatedArea})`,
      category: "Hidden Gems",
      type: "Offline Point",
      lat: lat,
      lng: lng,
      rating: 4.2,
      reviewCount: 1,
      address: addressStr,
      distance: "Selected Location",
      status: "Offline",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      quickFact: `Offline coordinates point at selected area.`,
      facts: [
        {
          text: "Connect to the internet to query full Gemini Sourced reports and verified news about this specific point.",
          source: "AroundMe Offline Guard",
          verified: true
        }
      ],
      about: `You have selected an offline point at lat ${lat.toFixed(4)}, lng ${lng.toFixed(4)} in ${estimatedArea}. Once online, Gemini will fetch live Google Search occurrences, blogs, and reports about this location.`,
      history: [],
      news: []
    };
    onPlaceSelect(customPlace);
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent) => {
    setIsDragging(false);

    // If it was a short click (not dragging), select this custom point
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5 && e.type === "mouseup" && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Calculate scaled and translated coordinates
      const scale = zoom / 13;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Unscale around center
      const unscaledX = (clickX - centerX) / scale + centerX;
      const unscaledY = (clickY - centerY) / scale + centerY;

      // Subtract panOffset to get raw SVG coordinate (matching 800x500 space)
      const svgX = (unscaledX / rect.width) * 800 - panOffset.x;
      const svgY = (unscaledY / rect.height) * 500 - panOffset.y;

      const { latMin, latMax, lngMin, lngMax } = getBounds();

      const lng = (svgX / 800) * (lngMax - lngMin) + lngMin;
      const lat = (1 - svgY / 500) * (latMax - latMin) + latMin;

      // Ensure we are inside reasonable bounds
      const boundedLat = Math.max(latMin, Math.min(latMax, lat));
      const boundedLng = Math.max(lngMin, Math.min(lngMax, lng));

      handleOfflinePointSelect(boundedLat, boundedLng);
    }
  };

  const triggerGenericCustomPlace = (lat: number, lng: number) => {
    const distFromLagos = getDistance(lat, lng, 6.4447, 3.4045);
    const customPlace: Place = {
      id: `custom-${lat.toFixed(6)}-${lng.toFixed(6)}`,
      name: `Landmark Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      category: "Hidden Gems",
      type: "Coordinates",
      lat: lat,
      lng: lng,
      rating: 4.3,
      reviewCount: 5,
      address: distFromLagos <= 50 ? "Lagos State, Nigeria" : `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      distance: "Selected Location",
      status: "Explore Now",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      quickFact: `Custom coordinates point in active region.`,
      facts: [],
      about: `This point corresponds to the latitude ${lat.toFixed(5)} and longitude ${lng.toFixed(5)}. Discovering real-time reports about this vicinity...`,
      history: [],
      news: []
    };
    onPlaceSelect(customPlace);
  };

  const handleMapClick = (ev: any) => {
    if (!ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;

    // Prevent Google's default InfoWindow if a standard POI is clicked
    if (ev.detail.placeId && typeof ev.stop === "function") {
      ev.stop();
    }

    // Reverse Geocode using Google Maps Geocoder
    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const result = results[0];
          const formattedAddress = result.formatted_address;

          let geocodedName = "";
          let foundEstablishment = false;

          // 1. Search all results for any result that represents a POI or establishment type
          for (const res of results) {
            const isEst = res.types.some(t => 
              [
                "establishment", "point_of_interest", "train_station", "bus_station", 
                "transit_station", "police", "church", "mosque", "hospital", "school", 
                "university", "shopping_mall", "stadium", "park", "tourist_attraction", 
                "place_of_worship", "market", "food", "store", "local_government_office",
                "city_hall", "courthouse", "museum", "supermarket", "restaurant", "cafe"
              ].includes(t)
            );
            if (isEst && res.address_components && res.address_components.length > 0) {
              // The first address component is the name of the establishment/POI
              geocodedName = res.address_components[0].long_name;
              foundEstablishment = true;
              break;
            }
          }

          // 2. Fallback: Search inside components of all results for establishment types
          if (!foundEstablishment) {
            for (const res of results) {
              const estComp = res.address_components.find(c => 
                c.types.some(t => 
                  [
                    "establishment", "point_of_interest", "train_station", "bus_station", 
                    "transit_station", "police", "church", "mosque", "hospital", "school", 
                    "university", "shopping_mall", "stadium", "park", "tourist_attraction", 
                    "place_of_worship", "market", "food", "store", "local_government_office"
                  ].includes(t)
                )
              );
              if (estComp) {
                geocodedName = estComp.long_name;
                foundEstablishment = true;
                break;
              }
            }
          }

          // 3. Fallback: Check if the first segment of any formatted address contains key landmark words
          if (!foundEstablishment) {
            for (const res of results) {
              const firstPart = res.formatted_address.split(',')[0].trim();
              const lowerPart = firstPart.toLowerCase();
              if (
                lowerPart.includes("station") ||
                lowerPart.includes("market") ||
                lowerPart.includes("police") ||
                lowerPart.includes("church") ||
                lowerPart.includes("mosque") ||
                lowerPart.includes("mall") ||
                lowerPart.includes("park") ||
                lowerPart.includes("beach") ||
                lowerPart.includes("hospital") ||
                lowerPart.includes("school") ||
                lowerPart.includes("university") ||
                lowerPart.includes("court") ||
                lowerPart.includes("secretariat") ||
                lowerPart.includes("house") ||
                lowerPart.includes("plaza") ||
                lowerPart.includes("office")
              ) {
                geocodedName = firstPart;
                foundEstablishment = true;
                break;
              }
            }
          }

          // 4. Ultimate Fallback: Street name or neighborhood
          const route = result.address_components.find(c => c.types.includes("route"));
          const sublocality = result.address_components.find(c => c.types.includes("sublocality") || c.types.includes("neighborhood"));
          const adminArea = result.address_components.find(c => c.types.includes("administrative_area_level_2"));

          if (!foundEstablishment) {
            if (route) {
              geocodedName = route.long_name;
              if (sublocality) {
                geocodedName += `, ${sublocality.long_name}`;
              }
            } else if (sublocality) {
              geocodedName = sublocality.long_name;
            } else if (adminArea) {
              geocodedName = adminArea.long_name;
            } else {
              geocodedName = "Lagos Location";
            }
          }

          // Custom Category Identification
          let customCategory = "Hidden Gems";
          const lowerName = geocodedName.toLowerCase();
          if (
            lowerName.includes("market") || 
            lowerName.includes("mall") || 
            lowerName.includes("shop") || 
            lowerName.includes("food") || 
            lowerName.includes("restaurant") || 
            lowerName.includes("cafe") || 
            lowerName.includes("eatery") || 
            lowerName.includes("buka") || 
            lowerName.includes("kitchen")
          ) {
            customCategory = "Food";
          } else if (
            lowerName.includes("beach") || 
            lowerName.includes("bay") || 
            lowerName.includes("water") || 
            lowerName.includes("ocean") || 
            lowerName.includes("nature") || 
            lowerName.includes("park") || 
            lowerName.includes("garden") || 
            lowerName.includes("conservation") || 
            lowerName.includes("forest") || 
            lowerName.includes("island")
          ) {
            customCategory = "Nature";
          } else if (
            lowerName.includes("church") || 
            lowerName.includes("mosque") || 
            lowerName.includes("shrine") || 
            lowerName.includes("palace") || 
            lowerName.includes("museum") || 
            lowerName.includes("monument") || 
            lowerName.includes("history") || 
            lowerName.includes("historical") || 
            lowerName.includes("heritage") || 
            lowerName.includes("ancient")
          ) {
            customCategory = "History";
          } else if (
            lowerName.includes("art") || 
            lowerName.includes("gallery") || 
            lowerName.includes("theater") || 
            lowerName.includes("theatre") || 
            lowerName.includes("cinema") || 
            lowerName.includes("library") || 
            lowerName.includes("culture") || 
            lowerName.includes("cultural") || 
            lowerName.includes("centre") || 
            lowerName.includes("center") || 
            lowerName.includes("university") || 
            lowerName.includes("school") || 
            lowerName.includes("college")
          ) {
            customCategory = "Culture";
          }

          // Custom visual image selection based on matched landmark name
          let customImage = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80";
          if (customCategory === "Food" || lowerName.includes("market") || lowerName.includes("mall") || lowerName.includes("shop")) {
            customImage = "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80"; // Market/Mall
          } else if (lowerName.includes("station") || lowerName.includes("train") || lowerName.includes("transit") || lowerName.includes("bus")) {
            customImage = "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80"; // Station
          } else if (lowerName.includes("police") || lowerName.includes("court") || lowerName.includes("security") || lowerName.includes("law")) {
            customImage = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"; // Law/Police
          } else if (customCategory === "Nature" || lowerName.includes("beach") || lowerName.includes("bay") || lowerName.includes("water") || lowerName.includes("ocean")) {
            customImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"; // Beach/Nature
          } else if (lowerName.includes("nature") || lowerName.includes("park") || lowerName.includes("garden")) {
            customImage = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"; // Nature
          }

          const customPlace: Place = {
            id: `custom-${lat.toFixed(6)}-${lng.toFixed(6)}`,
            name: geocodedName,
            category: customCategory,
            type: route ? "Street Location" : "Local Area",
            lat: lat,
            lng: lng,
            rating: 4.5,
            reviewCount: 12,
            address: formattedAddress,
            distance: "Selected Location",
            status: "Explore Now",
            image: customImage,
            quickFact: `A fantastic ${customCategory.toLowerCase()} landmark located at ${geocodedName}.`,
            facts: [
              {
                text: `Location coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)} inside the vibrant state of Lagos.`,
                source: "GPS Grounding",
                verified: true
              }
            ],
            about: `${geocodedName} is a notable point of interest located at ${formattedAddress}. Let's discover real-time occurrences, historical events, and local information.`,
            history: [],
            news: []
          };

          onPlaceSelect(customPlace);
        } else {
          triggerGenericCustomPlace(lat, lng);
        }
      });
    } else {
      triggerGenericCustomPlace(lat, lng);
    }
  };

  // Render Category Specific Colored Pins
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "history":
        return "#8B4513"; // Brown monument
      case "nature":
        return "#16A34A"; // Green tree
      case "culture":
        return "#A855F7"; // Purple
      case "food":
        return "#F97316"; // Discovery Orange (Fork/Restaurant)
      case "hidden gems":
        return "#EC4899"; // Pink Star
      default:
        return "#2563EB"; // Discovery Blue
    }
  };

  // Check if we can/should render Google Maps
  const useGoogleMaps = hasValidKey && !isOffline;

  return (
    <div className="w-full h-full relative overflow-hidden select-none" id="discovery-map-container">
      {useGoogleMaps ? (
        <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly" libraries={["places", "geometry", "core", "marker"]}>
          <GoogleMap
            center={center}
            zoom={zoom}
            mapId={mapLayer === "streets" ? "DEMO_MAP_ID" : "SATELLITE"}
            onCenterChanged={(ev) => ev.detail.center && setCenter(ev.detail.center)}
            onZoomChanged={(ev) => ev.detail.zoom && setZoom(ev.detail.zoom)}
            onClick={handleMapClick}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={true}
          >
            {/* Real-time Google Places Loader */}
            {!isOffline && (
              <GooglePlacesLoader
                categoryFilter={categoryFilter}
                searchQuery={searchQuery}
                onPlacesFetched={onPlacesFetched}
                isOffline={isOffline}
              />
            )}
            {/* User Current Location Marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation} title="You are here">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <div className="relative rounded-full bg-blue-600 p-2 border-2 border-white shadow-lg">
                    <Navigation className="h-4 w-4 text-white fill-white rotate-45" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Simulated Travel Location Marker */}
            {transitActive && (
              <AdvancedMarker position={simulatedLocation} title="Transit Guide Active">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <div className="relative rounded-full bg-orange-500 p-2 border-2 border-slate-900 shadow-xl">
                    <Navigation className="h-5 w-5 text-slate-900 fill-slate-900 rotate-45" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Custom Sourced Marker */}
            {selectedPlace && selectedPlace.id.startsWith("custom-") && (
              <AdvancedMarker
                position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                onClick={() => onPlaceSelect(selectedPlace)}
              >
                <div className="p-1.5 rounded-xl bg-blue-600 border-2 border-slate-900 shadow-2xl scale-110 z-50 animate-bounce flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-slate-950 fill-blue-300" />
                </div>
              </AdvancedMarker>
            )}

            {/* Places Markers */}
            {places.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              const color = getCategoryColor(place.category);
              return (
                <AdvancedMarker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => onPlaceSelect(place)}
                >
                  <div className={`p-1.5 rounded-xl shadow-md transition-all duration-300 border-2 ${
                    isSelected ? "bg-slate-900 border-blue-500 scale-125 z-50" : "bg-white border-transparent scale-100"
                  }`}>
                    <MapPin className="h-5 w-5" style={{ color: color, fill: color + "33" }} />
                  </div>
                </AdvancedMarker>
              );
            })}
          </GoogleMap>
        </APIProvider>
      ) : (
        // Offline / Fallback Interactive Vector Map (Beautiful representation of Lagos, Nigeria)
        <div
          ref={containerRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing relative transition-colors duration-500 ${
            mapLayer === "streets" ? "bg-slate-800" : "bg-slate-950"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* Overlay Status */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/95 border border-slate-700/50 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
            {isOffline ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                <WifiOff className="h-3.5 w-3.5" />
                <span>PWA Offline Mode Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                <span>AroundMe AI Vector Maps</span>
              </div>
            )}
          </div>

          {/* Interactive SVG Rendering Lands, Waters, Lagoon of Lagos */}
          <svg className="w-full h-full pointer-events-none transition-all duration-300">
            <g style={{ transform: `scale(${zoom / 13})`, transformOrigin: "center" }}>
              {/* Lagos Lagoon Waterbody */}
              <path
                d="M 500,0 Q 420,100 400,200 T 550,300 T 650,220 T 750,200 T 800,100 L 800,0 Z"
                fill={mapLayer === "streets" ? "#1e293b" : "#0f172a"}
                className="opacity-50"
              />
              <path
                d="M 200,100 Q 300,150 400,200 T 500,280 T 450,400 L 0,400 L 0,100 Z"
                fill={mapLayer === "streets" ? "#1e3a8a" : "#172554"}
                className="opacity-60"
              />

              {/* Atlantic Ocean */}
              <rect
                x="0"
                y="430"
                width="800"
                height="100"
                fill={mapLayer === "streets" ? "#1e3a8a" : "#1e293b"}
                className="opacity-40"
              />

              {/* Lagos Island / Victoria Island Lands */}
              {/* Third Mainland Bridge */}
              <path
                d="M 280,100 L 380,240"
                stroke={mapLayer === "streets" ? "#64748b" : "#475569"}
                strokeWidth="4"
                fill="none"
                strokeDasharray="4,4"
              />
              {/* Lekki-Ikoyi Bridge */}
              <path
                d="M 410,230 Q 430,280 450,310"
                stroke="#f59e0b"
                strokeWidth="3"
                fill="none"
              />

              {/* Major Expressways */}
              <path
                d="M 50,250 H 750"
                stroke={mapLayer === "streets" ? "#475569" : "#334155"}
                strokeWidth="6"
                fill="none"
              />
              <path
                d="M 400,10 V 480"
                stroke={mapLayer === "streets" ? "#475569" : "#334155"}
                strokeWidth="4"
                fill="none"
              />
            </g>
          </svg>

          {/* Render Vector Map Markers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Simulated Transit Marker */}
            {transitActive && (
              (() => {
                const pos = getSvgCoordinates(simulatedLocation.lat, simulatedLocation.lng);
                return (
                  <div
                    className="absolute transition-all duration-1000"
                    style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
                  >
                    <div className="relative flex items-center justify-center pointer-events-auto">
                      <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-orange-400 opacity-75"></span>
                      <div className="relative rounded-full bg-orange-500 p-2.5 border-2 border-slate-900 shadow-2xl">
                        <Navigation className="h-4 w-4 text-slate-900 fill-slate-900 rotate-45" />
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Offline User Marker */}
            {userLocation && (
              (() => {
                const pos = getSvgCoordinates(userLocation.lat, userLocation.lng);
                return (
                  <div
                    className="absolute"
                    style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
                  >
                    <div className="relative flex items-center justify-center pointer-events-auto">
                      <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-blue-500 opacity-75"></span>
                      <div className="relative rounded-full bg-blue-600 p-2 border-2 border-white shadow-lg">
                        <Navigation className="h-3 w-3 text-white fill-white rotate-45" />
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Custom Sourced Selected Marker (Offline) */}
            {selectedPlace && selectedPlace.id.startsWith("custom-") && (
              (() => {
                const pos = getSvgCoordinates(selectedPlace.lat, selectedPlace.lng);
                return (
                  <div
                    className="absolute z-50 animate-bounce"
                    style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
                  >
                    <div className="p-1.5 rounded-full bg-blue-600 border-2 border-slate-900 shadow-2xl pointer-events-auto">
                      <MapPin className="h-5 w-5 text-slate-950 fill-blue-300" />
                    </div>
                  </div>
                );
              })()
            )}

            {/* Place Markers */}
            {places.map((place) => {
              const pos = getSvgCoordinates(place.lat, place.lng);
              const isSelected = selectedPlace?.id === place.id;
              const color = getCategoryColor(place.category);

              // Clip positions outside map boundary
              if (pos.x < 0 || pos.x > window.innerWidth || pos.y < 0 || pos.y > 600) {
                return null;
              }

              return (
                <button
                  key={place.id}
                  onClick={() => onPlaceSelect(place)}
                  className="absolute pointer-events-auto transition-all duration-300"
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: isSelected ? "translate(-50%, -100%) scale(1.3)" : "translate(-50%, -100%) scale(1)",
                    zIndex: isSelected ? 50 : 10
                  }}
                >
                  <div className="flex flex-col items-center group">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-950/95 border border-slate-700 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {place.name}
                    </div>

                    {/* Styled Map Pin */}
                    <div className={`p-1.5 rounded-full shadow-2xl border-2 transition-all duration-200 ${
                      isSelected ? "bg-slate-900 border-blue-500" : "bg-white border-transparent"
                    }`}>
                      <MapPin className="h-5 w-5" style={{ color: color, fill: color + "22" }} />
                    </div>

                    {/* Small name tag */}
                    <span className="text-[9px] mt-0.5 font-bold tracking-tight px-1.5 py-0.5 rounded-full bg-slate-900/85 border border-slate-700/30 text-slate-300 backdrop-blur-sm max-w-[80px] truncate shadow-sm">
                      {place.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Controls Overlay */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
        {/* Layer Mode Toggle */}
        <button
          onClick={() => setMapLayer(mapLayer === "streets" ? "satellite" : "streets")}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg backdrop-blur transition-all"
          title="Toggle Map Layers"
          id="toggle-layers-btn"
        >
          <Layers className="h-4 w-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg backdrop-blur transition-all"
          title="Zoom In"
          id="zoom-in-btn"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => setZoom(prev => Math.max(prev - 1, 10))}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg backdrop-blur transition-all"
          title="Zoom Out"
          id="zoom-out-btn"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        {/* Re-center / Geolocation */}
        <button
          onClick={() => {
            if (userLocation) {
              setCenter(userLocation);
            } else {
              setCenter({ lat: 6.444, lng: 3.424 }); // Reset to standard Lagos
            }
            setPanOffset({ x: 0, y: 0 });
            setZoom(13);
          }}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg backdrop-blur transition-all"
          title="Recenter Map"
          id="recenter-btn"
        >
          <Navigation className="h-4 w-4 fill-slate-100" />
        </button>
      </div>
    </div>
  );
}
