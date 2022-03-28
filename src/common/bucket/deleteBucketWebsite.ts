import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function deleteBucketWebsite(this: any, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}