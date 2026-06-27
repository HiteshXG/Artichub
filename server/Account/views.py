from email.message import EmailMessage

from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_current_site
from django.http import HttpResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.views import View
from jwt.utils import force_bytes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.generics import GenericAPIView
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from . import serializer
from .serializer import PasswordResetSerializer
from .token import account_activation_token
from django.conf import settings
import pprint
from .serializer import PasswordConfirmResetSerializer

# Create your views here.
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage, send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .serializer import (
    UserSerializer,
    LoginSerializer,
    LogoutSerializer,
    GetUserSerializer,
)
import json
from .token import TokenGenerator  # Ensure this is correctly imported
from rest_framework import generics


User = get_user_model()

import traceback

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.save()
                user.is_active = False
                user.save()

                current_site = get_current_site(request)
                domain = current_site.domain

                mail_subject = "Activate your Account"
                message = render_to_string(
                    "activation_email.html",
                    {
                        "domain": domain,
                        "user": user,
                        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                        "token": account_activation_token.make_token(user),
                    },
                )

                email = EmailMessage(
                    subject=mail_subject,
                    body=message,
                    from_email=settings.EMAIL_HOST_USER,
                    to=[user.email],
                )
                email.content_subtype = "html"
                email.send()

                return Response(
                    {"message": "Verification email sent successfully!"},
                    status=status.HTTP_201_CREATED,
                )

            return Response(serializer.errors, status=400)

        except Exception as e:
            traceback.print_exc()      # <-- prints the full traceback
            return Response(
                {"error": str(e)},
                status=500
            )

def activate(request, uidb64, token):
    User = get_user_model()
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        return HttpResponse("Thank you for your email confirmation. Now you can login.")
    else:
        return HttpResponse("Activation link is invalid!")


class Login_View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class Logout_View(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer_class = LogoutSerializer(data=request.data)
        if serializer_class.is_valid():
            return Response(serializer_class.validated_data, status=status.HTTP_200_OK)
        return Response(serializer_class.errors, status=status.HTTP_401_UNAUTHORIZED)


class InfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):  # ✅ Use GET instead of POST
        pprint.pprint(request.user)
        serializer = GetUserSerializer(
            data={}, context={"request": request}
        )  # Pass request in context
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class PasswordResetView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset link sent to your email"},
                status=status.HTTP_200_OK,
            )
        return Response(
            serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )  # ✅ Fix status code


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        print("🔹 Received Data:", json.dumps(request.data, indent=4))

        serializer = PasswordConfirmResetSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset successful"}, status=status.HTTP_200_OK
            )

        print("❌ Validation Error:", serializer.errors)  # DEBUG ERROR

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
