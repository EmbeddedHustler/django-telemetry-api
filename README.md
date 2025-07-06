# 🛰️ Telemetry API for Embedded Devices

## Overview
A Django-based backend API to receive and serve telemetry data (GPS, battery, orientation) from embedded systems like drones or IoT sensors.

## Features
- `/api/telemetry/` [POST] — log data
- `/api/telemetry/` [GET] — fetch all
- PostgreSQL backend
- JSON-ready, REST-compliant

## Sample Payload

```json
{
  "gps": [77.1234, 28.5678],
  "battery_percentage": 87,
  "state": {
    "pitch": 0.4,
    "yaw": -0.1,
    "roll": 2.0
  }
}
