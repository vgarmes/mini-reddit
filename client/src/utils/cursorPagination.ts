import { stringifyVariables } from '@urql/core';
import { Resolver } from '@urql/exchange-graphcache';

export type MergeMode = 'before' | 'after';

export interface PaginationParams {
  offsetArgument?: string;
  limitArgument?: string;
  mergeMode?: MergeMode;
}

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    // fieldArgs: {cursor: 12324531535, limit: 10}

    const { parentKey: entityKey, fieldName } = info; // entityKey = 'Query', fieldName = 'posts'

    const allFields = cache.inspectFields(entityKey); // this returns all the Queries contained in the cache
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName); // we filter the queries we are interested in ('posts')
    const size = fieldInfos.length;
    if (size === 0) {
      // there is no data in cache
      return undefined;
    }

    const fieldKey = `${entityKey}.${fieldName}(${stringifyVariables(
      fieldArgs
    )})`;
    //const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`; // posts({"cursor": 12324531535, "limit": 10})
    const isInCache = cache.resolve(fieldKey, 'posts');
    info.partial = !isInCache; // if data for fieldKey is not in cache, we tell urql to fetch it from server

    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fi) => {
      // entityKey: Query, fi.fieldKey: 'posts({"limit":10})'

      const key = `${entityKey}.${fi.fieldKey}`; // key = Query.posts({"limit":10})
      // const data = cache.resolve(entityKey, fi.fieldKey) as string[];

      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore');

      if (!_hasMore) {
        // it found a hasMore = false in cache
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return { __typename: 'PaginatedPosts', hasMore, posts: results }; // "full entity object has to be returned"
  };
};

// https://github.com/FormidableLabs/urql/blob/main/exchanges/graphcache/src/extras/simplePagination.ts
