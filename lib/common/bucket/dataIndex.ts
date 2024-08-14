// https://help.aliyun.com/zh/oss/developer-reference/data-indexing
// https://www.alibabacloud.com/help/en/oss/developer-reference/dometaquery
import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { formatObjKey } from '../utils/formatObjKey';

export async function openMetaQuery(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'add' }, options);
  params.successStatuses = [200];
  const result = await this.request(params);

  return {
    res: result.res,
    status: result.status
  };
}

export async function getMetaQueryStatus(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'metaQuery', options);
  params.successStatuses = [200];
  const result = await this.request(params);

  const data = await this.parseXML(result.data);
  return {
    res: result.res,
    status: result.status,
    phase: data.Phase,
    state: data.State,
    createTime: data.CreateTime,
    updateTime: data.UpdateTime
  };
}

interface IQuery {
  // the fields.
  field?: string;
  // the value of the field.
  value?: string;
  /* the operators. Valid values: eq (equal to), gt (greater than), gte (greater than or equal to),
   lt (less than), lte (less than or equal to), match (fuzzy query), prefix (prefix query), 
   and (AND), or (OR), and not (NOT). */
  operation: string;
  /* the subquery conditions. You must set subquery conditions only when Operation is set to AND, OR, or NOT. */
  subQueries?: IQuery[];
}

enum EOperation {
  min = 'min',
  max = 'max',
  average = 'average',
  sum = 'sum',
  count = 'count',
  distinct = 'distinct',
  group = 'group'
}

interface IAggregation {
  // The name of the field.
  field: string;
  // The operator for aggregate operations. Valid values:min,max,average,sum,count,distinct,group
  operation: EOperation;
}

interface IMetaQuery {
  /* The token that is used for the next query when the total number of objects exceeds the value of MaxResults. */
  nextToken?: string;
  // The maximum number of objects to return. Valid values: 0 to 100.
  maxResults?: number;
  // The query condition.
  query: IQuery;
  // The field based on which the results are sorted.
  sort?: string;
  // The order in which you want to sort the queried data.
  order?: 'asc' | 'desc';
  // The information about aggregate operations.
  aggregations?: IAggregation[];
}

export async function doMetaQuery(this: any, bucketName: string, queryParam: IMetaQuery, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'query' }, options);
  params.successStatuses = [200];

  const { aggregations } = queryParam;
  let aggregationsParam;
  if (aggregations && aggregations.length > 0) {
    aggregationsParam = {
      Aggregation: aggregations.map(item => ({ Field: item.field, Operation: item.operation }))
    };
  }

  const paramXMLObj = {
    MetaQuery: {
      NextToken: queryParam.nextToken,
      MaxResults: queryParam.maxResults,
      Query: JSON.stringify(formatObjKey(queryParam.query, 'firstUpperCase')),
      Sort: queryParam.sort,
      Order: queryParam.order,
      Aggregations: aggregationsParam
    }
  };
  params.mime = 'xml';
  params.content = obj2xml(paramXMLObj, { headers: true, firstUpperCase: true });

  const result = await this.request(params);

  const { NextToken, Files, Aggregations: aggRes } = await this.parseXML(result.data);

  let files: any[] = [];
  if (Files && Files.File) {
    const getFileObject = item => {
      const ossTagging = item.OSSTagging
        ? item.OSSTagging.map(tagging => ({
            key: tagging.Key,
            value: tagging.Value
          }))
        : [];
      const ossUserMeta = item.OSSUserMeta
        ? item.OSSUserMeta.map(meta => ({
            key: meta.Key,
            value: meta.Value
          }))
        : [];
      return {
        fileName: item.Filename,
        size: item.Size,
        fileModifiedTime: item.FileModifiedTime,
        ossObjectType: item.OSSObjectType,
        ossStorageClass: item.OSSStorageClass,
        objectACL: item.ObjectACL,
        eTag: item.ETag,
        ossTaggingCount: item.OSSTaggingCount,
        ossTagging,
        ossUserMeta,
        ossCRC64: item.OSSCRC64,
        serverSideEncryption: item.ServerSideEncryption,
        serverSideEncryptionCustomerAlgorithm: item.ServerSideEncryptionCustomerAlgorithm
      };
    };
    if (Files.File instanceof Array) {
      files = Files.File.map(getFileObject);
    } else {
      files = [getFileObject(Files.File)];
    }
  }

  let aggList: any[] = [];
  if (aggRes) {
    const getAggregationObject = item => ({
      field: item.Field,
      operation: item.Operation,
      value: item.Value,
      groups: item.Groups
        ? item.Groups.map(group => ({
            value: group.Value,
            count: group.Count
          }))
        : []
    });
    if (aggRes.Aggregation instanceof Array) {
      aggList = aggRes.Aggregation.map(getAggregationObject);
    } else {
      aggList = [getAggregationObject(aggRes.Aggregation)];
    }
  }

  return {
    res: result.res,
    status: result.status,
    nextToken: NextToken,
    files,
    aggregations: aggList
  };
}

export async function closeMetaQuery(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'delete' }, options);
  params.successStatuses = [200];

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}