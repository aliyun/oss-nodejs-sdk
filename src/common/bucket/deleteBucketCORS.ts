import { checkBucketName } from "../utils/checkBucketName";

export async function deleteBucketCORS(this: any, name: string, options: any = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'cors', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};