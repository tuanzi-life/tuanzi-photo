import OSS from "ali-oss";
import { env } from "../env.js";

let ossClient: OSS | null = null;

export function getOSSClient(): OSS {
  if (!ossClient) {
    ossClient = new OSS({
      region: env.oss.region,
      endpoint: env.oss.endpoint,
      accessKeyId: env.oss.accessKeyId,
      accessKeySecret: env.oss.accessKeySecret,
      bucket: env.oss.bucket,
      authorizationV4: true,
      secure: true,
    });
  }

  return ossClient;
}
