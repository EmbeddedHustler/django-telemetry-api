from rest_framework import serializers
from telemetry_api.models import TelemetryData

class TelemetrySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = TelemetryData
        fields = ['timestamp','lat', 'lon', 'battery_voltage', 'pitch', 'yaw', 'roll']
        read_only_fields = ['timestamp']