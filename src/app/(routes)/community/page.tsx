'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Search, Building2, Locate, Navigation as NavIcon, Phone, Mail, Info } from 'lucide-react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import toast from 'react-hot-toast';

type SectorOffice = {
  province: string;
  district: string;
  sector: string;
  sector_id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export default function CommunityPage() {
  const [offices, setOffices] = useState<SectorOffice[]>([]);
  const [filteredOffices, setFilteredOffices] = useState<SectorOffice[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<SectorOffice | null>(null);
  const [nearestOffice, setNearestOffice] = useState<SectorOffice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [viewState, setViewState] = useState({
    latitude: -1.9403,
    longitude: 29.8739,
    zoom: 8,
  });

  useEffect(() => {
    fetch('/data/sectors.geojson')
      .then(res => res.json())
      .then(data => {
        const officeData: SectorOffice[] = data.features.map((f: any) => ({
          province: f.properties.province || f.properties.PROVINCE,
          district: f.properties.district || f.properties.DISTRICT,
          sector: f.properties.sector || f.properties.SECTOR,
          sector_id: f.properties.sector_id || f.properties.SECTOR_ID,
          label: f.properties.label || f.properties.LABEL,
          latitude: f.properties.latitude || f.geometry.coordinates[1],
          longitude: f.properties.longitude || f.geometry.coordinates[0],
        }));
        setOffices(officeData);
        setFilteredOffices(officeData);
      })
      .catch(() => toast.error('Failed to load sector offices'));
  }, []);

  useEffect(() => {
    let filtered = offices;

    if (provinceFilter !== 'all') {
      filtered = filtered.filter(o => o.province === provinceFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.sector.toLowerCase().includes(term) ||
        o.district.toLowerCase().includes(term) ||
        o.province.toLowerCase().includes(term)
      );
    }

    setFilteredOffices(filtered);
  }, [searchTerm, provinceFilter, offices]);

  const provinces = Array.from(new Set(offices.map(o => o.province)));

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearestOffice = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    toast.loading('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });

        let nearest = offices[0];
        let minDistance = calculateDistance(latitude, longitude, offices[0].latitude, offices[0].longitude);

        offices.forEach(office => {
          const distance = calculateDistance(latitude, longitude, office.latitude, office.longitude);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = office;
          }
        });

        setNearestOffice(nearest);
        setSelectedOffice(nearest);
        setViewState({
          latitude: nearest.latitude,
          longitude: nearest.longitude,
          zoom: 12,
        });
        toast.dismiss();
        toast.success(`Nearest office: ${nearest.sector} (${minDistance.toFixed(1)} km away)`);
      },
      () => {
        toast.dismiss();
        toast.error('Unable to get location');
      }
    );
  };

  const handleOfficeClick = (office: SectorOffice) => {
    setSelectedOffice(office);
    setViewState({
      latitude: office.latitude,
      longitude: office.longitude,
      zoom: 12,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Community Outreach</h1>
          <p className="text-muted-foreground">
            Locate sector offices across Rwanda for community engagement and support
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Data source: NISR AGOL Geospatial Data Platform
          </p>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="contact">Contact Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Sector Offices ({filteredOffices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={findNearestOffice} className="w-full" variant="default">
                    <Locate className="h-4 w-4 mr-2" />
                    Find Nearest Office
                  </Button>

                  {nearestOffice && (
                    <Card className="bg-primary/5 border-primary">
                      <CardContent className="pt-4">
                        <p className="text-xs font-medium mb-1">Nearest Office:</p>
                        <p className="font-semibold">{nearestOffice.sector}</p>
                        <p className="text-sm text-muted-foreground">
                          {nearestOffice.district}, {nearestOffice.province}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sector, district..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {provinces.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredOffices.map((office, idx) => (
                      <Button
                        key={idx}
                        variant={selectedOffice === office ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => handleOfficeClick(office)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold">{office.sector}</span>
                          <span className="text-xs text-muted-foreground">
                            {office.district}, {office.province}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardContent className="p-0">
                  <div className="h-[700px] rounded-lg overflow-hidden">
                    <Map
                      {...viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                    >
                      <NavigationControl position="top-right" />
                      <GeolocateControl position="top-right" />

                      {userLocation && (
                        <Marker latitude={userLocation.lat} longitude={userLocation.lon} anchor="center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                        </Marker>
                      )}

                      {filteredOffices.map((office, idx) => (
                        <Marker
                          key={idx}
                          latitude={office.latitude}
                          longitude={office.longitude}
                          anchor="bottom"
                        >
                          <button
                            onClick={() => setSelectedOffice(office)}
                            className="cursor-pointer"
                          >
                            <MapPin
                              className={`h-6 w-6 ${
                                selectedOffice === office
                                  ? 'text-primary fill-primary'
                                  : nearestOffice === office
                                  ? 'text-green-500 fill-green-500'
                                  : 'text-destructive fill-destructive'
                              }`}
                            />
                          </button>
                        </Marker>
                      ))}

                      {selectedOffice && (
                        <Popup
                          latitude={selectedOffice.latitude}
                          longitude={selectedOffice.longitude}
                          anchor="top"
                          onClose={() => setSelectedOffice(null)}
                          closeOnClick={false}
                        >
                          <div className="p-2">
                            <h3 className="font-semibold text-sm">{selectedOffice.sector}</h3>
                            <p className="text-xs text-muted-foreground">{selectedOffice.district}</p>
                            <p className="text-xs text-muted-foreground">{selectedOffice.province}</p>
                            <p className="text-xs mt-1">
                              {selectedOffice.latitude.toFixed(4)}, {selectedOffice.longitude.toFixed(4)}
                            </p>
                            {userLocation && (
                              <p className="text-xs mt-1 font-medium">
                                {calculateDistance(userLocation.lat, userLocation.lon, selectedOffice.latitude, selectedOffice.longitude).toFixed(1)} km away
                              </p>
                            )}
                          </div>
                        </Popup>
                      )}
                    </Map>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    About Sector Offices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sector offices serve as local administrative centers providing essential services to communities across Rwanda.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Services Available:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Civil registration and vital statistics</li>
                      <li>Land administration and management</li>
                      <li>Social protection programs</li>
                      <li>Community development initiatives</li>
                      <li>Agricultural extension services</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sector office locations are sourced from the National Institute of Statistics of Rwanda (NISR)
                    AGOL Geospatial Data Platform.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This platform provides authoritative geospatial data for Rwanda, including administrative boundaries,
                    infrastructure locations, and demographic information.
                  </p>
                  <a
                    href="https://statistics.gov.rw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Visit NISR Website
                    <NavIcon className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{offices.length}</p>
                      <p className="text-xs text-muted-foreground">Total Offices</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{provinces.length}</p>
                      <p className="text-xs text-muted-foreground">Provinces</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{Array.from(new Set(offices.map(o => o.district))).length}</p>
                      <p className="text-xs text-muted-foreground">Districts</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{filteredOffices.length}</p>
                      <p className="text-xs text-muted-foreground">Filtered Results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm">Police Emergency</p>
                    <p className="text-sm text-muted-foreground">112</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Fire Brigade</p>
                    <p className="text-sm text-muted-foreground">111</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Medical Emergency</p>
                    <p className="text-sm text-muted-foreground">912</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    General Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    For general inquiries about sector services, please contact your local sector office directly
                    or visit during business hours (Monday - Friday, 8:00 AM - 5:00 PM).
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can also reach out to the district administration office for assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
