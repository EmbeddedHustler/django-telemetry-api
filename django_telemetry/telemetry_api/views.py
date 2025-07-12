from django.shortcuts import render
from django.core.paginator import Paginator
from django.core.paginator import EmptyPage
from telemetry_api.models import TelemetryData
from telemetry_api.serializers import TelemetrySerializer
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
class TelemetryAllView(APIView):
    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        all_data = TelemetryData.objects.order_by('-timestamp')
        paginator = Paginator(all_data, page_size)
        try :
            page_obj = paginator.page(page)
        except EmptyPage:
            return Response(
                {"detail": f"Page {page} is out of range."},
                status=status.HTTP_404_NOT_FOUND
            )
        

        serializer = TelemetrySerializer(page_obj, many=True)
        return Response({
            "count": paginator.count,
            "pages": paginator.num_pages,
            "current_page": page,
            "results": serializer.data
        })
    

class TelemetryNView(APIView):
    def get(self, request, count):
        #count = int(request.GET.get("count", 10))
        data = TelemetryData.objects.order_by('-timestamp')[:count]
        serializer = TelemetrySerializer(data, many=True)
        return Response(serializer.data)

class TelemetryLatestView(APIView):
    def get(self, request):
        latest = TelemetryData.objects.order_by('-timestamp').first()
        if not latest:
            return Response({"detail": "No telemetry available"}, status=404)
        serializer = TelemetrySerializer(latest)
        return Response(serializer.data)
    

class TelemetryPostView(APIView):
    def post(self, request):
        data = request.data
        many = isinstance(data, list)

        serializer = TelemetrySerializer(data=data, many=many)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
