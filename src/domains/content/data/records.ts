/**
 * Persistence mappings owned by the content team.
 */

import * as contentContentApi from "../../../../.cache/proto/acme/content/v1/content.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map article API values to the database document boundary.
 */
export function toArticleRecord(tenantId: string, value: contentContentApi.Article): StoredRecord {
  return { tenantId, recordId: value.articleId, kind: "article",
    document: contentContentApi.Article.toJSON(value) };
}

export function fromArticleRecord(record: StoredRecord): contentContentApi.Article {
  return contentContentApi.Article.fromJSON(record.document);
}

/**
 * Map content block API values to the database document boundary.
 */
export function toContentBlockRecord(tenantId: string, value: contentContentApi.ContentBlock): StoredRecord {
  return { tenantId, recordId: value.contentBlockId, kind: "content_block",
    document: contentContentApi.ContentBlock.toJSON(value) };
}

export function fromContentBlockRecord(record: StoredRecord): contentContentApi.ContentBlock {
  return contentContentApi.ContentBlock.fromJSON(record.document);
}

/**
 * Map content revision API values to the database document boundary.
 */
export function toContentRevisionRecord(tenantId: string, value: contentContentApi.ContentRevision): StoredRecord {
  return { tenantId, recordId: value.contentRevisionId, kind: "content_revision",
    document: contentContentApi.ContentRevision.toJSON(value) };
}

export function fromContentRevisionRecord(record: StoredRecord): contentContentApi.ContentRevision {
  return contentContentApi.ContentRevision.fromJSON(record.document);
}

/**
 * Map taxonomy API values to the database document boundary.
 */
export function toTaxonomyRecord(tenantId: string, value: contentContentApi.Taxonomy): StoredRecord {
  return { tenantId, recordId: value.taxonomyId, kind: "taxonomy",
    document: contentContentApi.Taxonomy.toJSON(value) };
}

export function fromTaxonomyRecord(record: StoredRecord): contentContentApi.Taxonomy {
  return contentContentApi.Taxonomy.fromJSON(record.document);
}
