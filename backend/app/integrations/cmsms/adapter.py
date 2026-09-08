import datetime

def fetch_cmsms_satellite_signals(mine_code: str = None) -> list[dict]:
    """
    Simulated CMSMS / Khanan Prahari satellite imagery & thermal excavation data stream.
    """
    signals = [
        {
            "mine_code": "MINE-D",
            "mine_name": "Raniganj Sonepur Bazari (ECL)",
            "satellite": "Sentinel-2 L2A Thermal Infrared",
            "activity_detected": True,
            "excavation_area_sq_m": 42500,
            "confidence": 94.5,
            "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).isoformat(),
            "raw_geo_bbox": [23.6333, 87.1667, 23.6450, 87.1780]
        },
        {
            "mine_code": "MINE-C",
            "mine_name": "Singrauli Block-B (NCL)",
            "satellite": "ISRO Cartosat-3 Optical Surface Sensor",
            "activity_detected": True,
            "excavation_area_sq_m": 31200,
            "confidence": 88.0,
            "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(hours=5)).isoformat(),
            "raw_geo_bbox": [24.2012, 82.6644, 24.2100, 82.6750]
        },
        {
            "mine_code": "MINE-B",
            "mine_name": "Gevra Mega Opencast (SECL)",
            "satellite": "Sentinel-2 L2A Thermal Infrared",
            "activity_detected": True,
            "excavation_area_sq_m": 98000,
            "confidence": 96.0,
            "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(hours=1)).isoformat(),
            "raw_geo_bbox": [22.3504, 82.6841, 22.3650, 82.6990]
        }
    ]

    if mine_code:
        return [s for s in signals if s["mine_code"] == mine_code]
    return signals
