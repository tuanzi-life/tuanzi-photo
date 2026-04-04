import { getOSSClient } from "../utils/oss.js";

/**
 * 上传照片到 OSS
 * @param filePath 本地路径
 * @param objectKey object key
 * @returns
 */
export async function uploadPhotoToOSS(
  filePath: string,
  objectKey: string
): Promise<boolean> {
  const client = getOSSClient();
  const result = await client.put(objectKey, filePath);
  return result.res.status === 200;
}

/**
 * 从 OSS 删除照片
 * @param objectKey object key
 * @returns
 */
export async function deletePhotoFromOSS(objectKey: string): Promise<boolean> {
  const client = getOSSClient();
  const result = await client.delete(objectKey);
  return result.res.status === 200;
}

/**
 * 获取预签名 url
 * @param objectKey object key
 * @returns
 */
export async function getPhotoURL(objectKey: string): Promise<string> {
  const client = getOSSClient();
  return client.signatureUrl(objectKey, { expires: 3600 });
}

/**
 * 获取带图片处理参数的预签名 url
 * @param objectKey object key
 * @param style https://help.aliyun.com/zh/oss/developer-reference/img-5
 * @returns
 */
export async function getPhotoProcessURL(
  objectKey: string,
  style: string
): Promise<string> {
  const client = getOSSClient();
  return client.signatureUrl(objectKey, { process: style, expires: 3600 });
}

/**
 * 获取照片信息
 * @param objectKey object key
 * @returns
 */
export async function getPhotoInfo(objectKey: string): Promise<{
  fileSize: string;
  format: string;
  frameCount: string;
  imageHeight: string;
  imageWidth: string;
  resolutionUnit: string;
  xResolution: string;
  yResolution: string;
}> {
  const url = await getPhotoProcessURL(objectKey, "image/info");
  const response = await (await fetch(url)).json();
  return {
    fileSize: response.FileSize.value,
    format: response.Format.value,
    frameCount: response.FrameCount.value,
    imageHeight: response.ImageHeight.value,
    imageWidth: response.ImageWidth.value,
    resolutionUnit: response.ResolutionUnit.value,
    xResolution: response.XResolution.value,
    yResolution: response.YResolution.value,
  };
}
