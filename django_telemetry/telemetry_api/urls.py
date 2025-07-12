from django.urls import path
from .views import (
    TelemetryPostView,
    TelemetryLatestView,
    TelemetryNView,
    TelemetryAllView
)

urlpatterns = [
    path('telemetry', TelemetryPostView.as_view(), name='telemetry-post'),
    path('telemetry/latest', TelemetryLatestView.as_view(), name='telemetry-latest'),
    path('telemetry/<int:count>', TelemetryNView.as_view(), name='telemetry-n'),
    path('telemetry/all', TelemetryAllView.as_view(), name='telemetry-all'),
]