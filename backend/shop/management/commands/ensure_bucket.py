import os
import time
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Creates the MinIO bucket and makes its images publicly readable."
    def handle(self, *args, **options):
        client = boto3.client("s3", endpoint_url=f"http://{os.getenv('MINIO_ENDPOINT', 'minio:9000')}", aws_access_key_id=os.getenv("MINIO_ROOT_USER", "minioadmin"), aws_secret_access_key=os.getenv("MINIO_ROOT_PASSWORD", "minioadmin123"), region_name="us-east-1", config=Config(s3={"addressing_style": "path"}))
        bucket = os.getenv("MINIO_BUCKET", "product-images")
        for _ in range(10):
            try:
                client.head_bucket(Bucket=bucket)
                break
            except ClientError as exc:
                if exc.response["Error"]["Code"] in ("404", "NoSuchBucket"):
                    client.create_bucket(Bucket=bucket)
                    break
                time.sleep(2)
            except BotoCoreError:
                time.sleep(2)
        policy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::' + bucket + '/*"]}]}'
        client.put_bucket_policy(Bucket=bucket, Policy=policy)
        self.stdout.write(self.style.SUCCESS(f"MinIO bucket '{bucket}' is ready."))
