import os
import hashlib
import boto3
from django.conf import settings


class LocalStorage:
    """
    Local file storage for development — no AWS needed.
    Files saved to MEDIA_ROOT/calls/
    """

    def upload_file(self, file_obj, s3_key, content_type=None):
        path = os.path.join(settings.MEDIA_ROOT, s3_key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            for chunk in file_obj.chunks():
                f.write(chunk)
        return s3_key

    def generate_presigned_url(self, s3_key, expiry=None):
        return f"{settings.MEDIA_URL}{s3_key}"

    def delete_file(self, s3_key):
        path = os.path.join(settings.MEDIA_ROOT, s3_key)
        if os.path.exists(path):
            os.remove(path)

    def build_s3_key(self, tenant_id, call_id, filename):
        return f"{tenant_id}/calls/{call_id}/{filename}"


class S3Storage:
    """Production S3 storage."""

    def __init__(self):
        self.client = boto3.client(
            "s3",
            region_name=settings.AWS_S3_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME

    def upload_file(self, file_obj, s3_key, content_type=None):
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        self.client.upload_fileobj(file_obj, self.bucket, s3_key, ExtraArgs=extra_args)
        return s3_key

    def generate_presigned_url(self, s3_key, expiry=None):
        expiry = expiry or settings.AWS_PRESIGNED_URL_EXPIRY
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": s3_key},
            ExpiresIn=expiry,
        )

    def delete_file(self, s3_key):
        self.client.delete_object(Bucket=self.bucket, Key=s3_key)

    def build_s3_key(self, tenant_id, call_id, filename):
        return f"{tenant_id}/calls/{call_id}/{filename}"


# DEBUG TRUE = local storage, DEBUG FALSE = S3 storage
if settings.DEBUG:
    s3_storage = LocalStorage()
else:
    s3_storage = S3Storage()