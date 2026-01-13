/**
 * R2 存储工具
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type _Object,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "asterhub-registry";

/**
 * 上传到 R2
 */
export async function uploadToR2(key: string, content: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: "application/json",
    })
  );
}

/**
 * 从 R2 获取
 */
export async function getFromR2(key: string): Promise<string | null> {
  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return (await response.Body?.transformToString()) || null;
  } catch (error: unknown) {
    if ((error as { name?: string }).name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

/**
 * 从 R2 删除
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * 列出 R2 对象
 */
export async function listR2Objects(prefix: string): Promise<string[]> {
  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );
  return (
    response.Contents?.map((obj: _Object) => obj.Key).filter(
      (key: string | undefined): key is string => Boolean(key)
    ) || []
  );
}

/**
 * 获取 R2 公开 URL
 */
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL || "https://r2.asterhub.dev";
  return `${publicUrl}/${key}`;
}

/**
 * 检查对象是否存在
 */
export async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
