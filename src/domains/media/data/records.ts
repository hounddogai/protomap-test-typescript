/**
 * Persistence mappings owned by the media team.
 */

import * as mediaMediaApi from "../../../../.cache/proto/acme/media/v1/media.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map media asset API values to the database document boundary.
 */
export function toMediaAssetRecord(tenantId: string, value: mediaMediaApi.MediaAsset): StoredRecord {
  return { tenantId, recordId: value.mediaAssetId, kind: "media_asset",
    document: mediaMediaApi.MediaAsset.toJSON(value) };
}

export function fromMediaAssetRecord(record: StoredRecord): mediaMediaApi.MediaAsset {
  return mediaMediaApi.MediaAsset.fromJSON(record.document);
}

/**
 * Map rendition API values to the database document boundary.
 */
export function toRenditionRecord(tenantId: string, value: mediaMediaApi.Rendition): StoredRecord {
  return { tenantId, recordId: value.renditionId, kind: "rendition",
    document: mediaMediaApi.Rendition.toJSON(value) };
}

export function fromRenditionRecord(record: StoredRecord): mediaMediaApi.Rendition {
  return mediaMediaApi.Rendition.fromJSON(record.document);
}

/**
 * Map transcode job API values to the database document boundary.
 */
export function toTranscodeJobRecord(tenantId: string, value: mediaMediaApi.TranscodeJob): StoredRecord {
  return { tenantId, recordId: value.transcodeJobId, kind: "transcode_job",
    document: mediaMediaApi.TranscodeJob.toJSON(value) };
}

export function fromTranscodeJobRecord(record: StoredRecord): mediaMediaApi.TranscodeJob {
  return mediaMediaApi.TranscodeJob.fromJSON(record.document);
}
