/**
 * Persistence mappings owned by the audiences team.
 */

import * as audiencesAudiencesApi from "../../../../.cache/proto/acme/audiences/v1/audiences.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map audience API values to the database document boundary.
 */
export function toAudienceRecord(tenantId: string, value: audiencesAudiencesApi.Audience): StoredRecord {
  return { tenantId, recordId: value.audienceId, kind: "audience",
    document: audiencesAudiencesApi.Audience.toJSON(value) };
}

export function fromAudienceRecord(record: StoredRecord): audiencesAudiencesApi.Audience {
  return audiencesAudiencesApi.Audience.fromJSON(record.document);
}

/**
 * Map audience member API values to the database document boundary.
 */
export function toAudienceMemberRecord(tenantId: string, value: audiencesAudiencesApi.AudienceMember): StoredRecord {
  return { tenantId, recordId: value.audienceMemberId, kind: "audience_member",
    document: audiencesAudiencesApi.AudienceMember.toJSON(value) };
}

export function fromAudienceMemberRecord(record: StoredRecord): audiencesAudiencesApi.AudienceMember {
  return audiencesAudiencesApi.AudienceMember.fromJSON(record.document);
}

/**
 * Map audience sync API values to the database document boundary.
 */
export function toAudienceSyncRecord(tenantId: string, value: audiencesAudiencesApi.AudienceSync): StoredRecord {
  return { tenantId, recordId: value.audienceSyncId, kind: "audience_sync",
    document: audiencesAudiencesApi.AudienceSync.toJSON(value) };
}

export function fromAudienceSyncRecord(record: StoredRecord): audiencesAudiencesApi.AudienceSync {
  return audiencesAudiencesApi.AudienceSync.fromJSON(record.document);
}
