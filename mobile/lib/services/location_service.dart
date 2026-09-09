import 'package:geolocator/geolocator.dart';

class LocationResult {
  final double latitude;
  final double longitude;
  final double accuracy;
  final bool isMockOrFallback;
  final String? error;

  LocationResult({
    required this.latitude,
    required this.longitude,
    this.accuracy = 5.0,
    this.isMockOrFallback = false,
    this.error,
  });
}

class LocationService {
  // Default coordinates for Indian coal fields (Jharia Opencast / Singrauli)
  static const double fallbackLat = 23.7466;
  static const double fallbackLng = 86.4162;

  static Future<LocationResult> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return LocationResult(
          latitude: fallbackLat,
          longitude: fallbackLng,
          isMockOrFallback: true,
          error: 'GPS location services are disabled on device.',
        );
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return LocationResult(
            latitude: fallbackLat,
            longitude: fallbackLng,
            isMockOrFallback: true,
            error: 'Location permissions denied by user.',
          );
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return LocationResult(
          latitude: fallbackLat,
          longitude: fallbackLng,
          isMockOrFallback: true,
          error: 'Location permissions permanently denied.',
        );
      }

      // Fetch precise GPS fix with 10s timeout
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return LocationResult(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        isMockOrFallback: false,
      );
    } catch (e) {
      return LocationResult(
        latitude: fallbackLat,
        longitude: fallbackLng,
        isMockOrFallback: true,
        error: e.toString(),
      );
    }
  }
}
