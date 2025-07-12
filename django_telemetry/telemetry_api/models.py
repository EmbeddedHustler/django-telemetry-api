from django.db import models

# Create your models here.
class TelemetryData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    lat = models.FloatField()
    lon = models.FloatField()
    battery_voltage = models.FloatField()
    pitch = models.FloatField()
    yaw = models.FloatField()
    roll = models.FloatField()
    
    def __str__(self):
        return f"['location' : {self.lat}:{self.lon}, \
            'battery_voltage' : {self.battery_voltage},\
            'pitch' : {self.pitch}, \
            'yaw' : {self.yaw}, \
            'roll' : {self.roll},]"
    
