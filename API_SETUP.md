# 🌐 API Configuration Guide

This guide explains how to configure the real APIs used in the Climate Risk Assessment application.

## 📋 Overview

The application now uses **real APIs** instead of mock data for:

- ✅ **NASA POWER** - Climate data (temperature, precipitation, solar radiation)
- ✅ **CHIRPS** - Precipitation data via ClimateSERV
- ✅ **SRTM Elevation** - Elevation data via multiple services
- ⚠️ **Sentinel Hub** - NDVI/vegetation data (requires configuration)

## 🔧 Environment Variables

Add these variables to your `.env.local` file:

```bash
# NASA POWER API (No API key required)
NEXT_PUBLIC_NASA_POWER_BASE_URL=https://power.larc.nasa.gov/api/

# CHIRPS API via ClimateSERV (No API key required)
NEXT_PUBLIC_CHIRPS_API_URL=https://climateserv.servirglobal.net/api/

# SRTM Elevation APIs (Optional - for enhanced elevation data)
NEXT_PUBLIC_OPENTOPOGRAPHY_API_URL=https://portal.opentopography.org/API/
NEXT_PUBLIC_OPENTOPOGRAPHY_API_KEY=your_opentopography_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Sentinel Hub (Required for vegetation data)
NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID=your_instance_id
NEXT_PUBLIC_SENTINEL_CLIENT_ID=your_client_id
NEXT_PUBLIC_SENTINEL_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID=your_layer_id

# Mapbox (Required for map functionality)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## 🚀 API Details

### 1. NASA POWER API

- **Status**: ✅ **Active** (No API key required)
- **Data**: Temperature, precipitation, solar radiation
- **Fallback**: Mock data if API fails
- **Rate Limits**: None (public API)

### 2. CHIRPS API (ClimateSERV)

- **Status**: ✅ **Active** (No API key required)
- **Data**: High-resolution precipitation data
- **Endpoint**: `https://climateserv.servirglobal.net/api/`
- **Fallback**: Mock data if API fails
- **Rate Limits**: Moderate (public service)

### 3. SRTM Elevation APIs

- **Status**: ✅ **Active** (Multiple services)
- **Services**:
  - **OpenTopography** (Primary) - Requires API key
  - **Google Maps Elevation** (Secondary) - Requires API key
  - **Nominatim/OpenStreetMap** (Fallback) - No API key required
- **Data**: Elevation, slope, aspect, flood risk
- **Fallback**: Mock data if all services fail

### 4. Sentinel Hub

- **Status**: ⚠️ **Requires Configuration**
- **Data**: NDVI, vegetation health, flood detection
- **Setup**: Requires Sentinel Hub account and instance configuration

## 🔑 API Key Setup

### OpenTopography API Key

1. Visit [OpenTopography](https://opentopography.org/)
2. Create an account
3. Go to "My OpenTopo" → "API Keys"
4. Generate a new API key
5. Add to `.env.local`: `NEXT_PUBLIC_OPENTOPOGRAPHY_API_KEY=your_key`

### Google Maps API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Elevation API"
4. Create credentials (API Key)
5. Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key`

### Sentinel Hub Setup

1. Visit [Sentinel Hub](https://www.sentinel-hub.com/)
2. Create an account and instance
3. Get your instance ID, client ID, and client secret
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID=your_instance_id
   NEXT_PUBLIC_SENTINEL_CLIENT_ID=your_client_id
   NEXT_PUBLIC_SENTINEL_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID=your_layer_id
   ```

## 🛡️ Fallback Mechanisms

The application includes robust fallback mechanisms:

1. **Primary API** → **Secondary API** → **Mock Data**
2. **Error Handling**: Graceful degradation with informative messages
3. **Data Validation**: Sanity checks for elevation and climate data
4. **User Feedback**: Clear status indicators in the API Status tab

## 📊 Data Sources

| **Data Type**   | **Primary Source** | **Fallback**                   | **Status**         |
| --------------- | ------------------ | ------------------------------ | ------------------ |
| Temperature     | NASA POWER         | Mock Data                      | ✅ Active          |
| Precipitation   | CHIRPS/ClimateSERV | Mock Data                      | ✅ Active          |
| Elevation       | OpenTopography     | Google Maps → Nominatim → Mock | ✅ Active          |
| NDVI            | Sentinel Hub       | Mock Data                      | ⚠️ Config Required |
| Solar Radiation | NASA POWER         | Mock Data                      | ✅ Active          |

## 🔍 Testing APIs

To test if your APIs are working:

1. **Check API Status Tab**: Visit the Insights page → API Status tab
2. **Console Logs**: Check browser console for API success/failure messages
3. **Data Quality**: Verify that data appears realistic (not random mock data)

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:

   - **Solution**: APIs now use proper headers and fallback mechanisms
   - **Check**: Browser console for specific error messages

2. **API Key Issues**:

   - **Solution**: Verify API keys are correctly set in `.env.local`
   - **Check**: Restart development server after adding new environment variables

3. **Rate Limiting**:

   - **Solution**: APIs include retry logic and fallback services
   - **Check**: API Status tab shows which services are active

4. **Data Format Issues**:
   - **Solution**: APIs include data validation and error handling
   - **Check**: Console logs for data processing messages

### Debug Mode

Enable debug logging by adding to `.env.local`:

```bash
NEXT_PUBLIC_DEBUG_APIS=true
```

## 📈 Performance

- **Caching**: React Query caches API responses for 5 minutes
- **Parallel Requests**: Multiple APIs called simultaneously
- **Timeout**: 30-second timeout for all API requests
- **Retry Logic**: Automatic retry with exponential backoff

## 🔄 Updates

The application automatically:

- Validates date ranges for NASA POWER API
- Handles CORS restrictions gracefully
- Provides realistic fallback data
- Shows clear status indicators

## 📞 Support

If you encounter issues:

1. Check the API Status tab in the application
2. Review browser console for error messages
3. Verify environment variables are set correctly
4. Test APIs individually using the provided endpoints

---

**🎉 Your application now uses real climate and elevation data with robust fallback mechanisms!**
