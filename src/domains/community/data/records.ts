/**
 * Persistence mappings owned by the community team.
 */

import * as communityCommunityApi from "../../../../.cache/proto/acme/community/v1/community.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map badge API values to the database document boundary.
 */
export function toBadgeRecord(tenantId: string, value: communityCommunityApi.Badge): StoredRecord {
  return { tenantId, recordId: value.badgeId, kind: "badge",
    document: communityCommunityApi.Badge.toJSON(value) };
}

export function fromBadgeRecord(record: StoredRecord): communityCommunityApi.Badge {
  return communityCommunityApi.Badge.fromJSON(record.document);
}

/**
 * Map forum API values to the database document boundary.
 */
export function toForumRecord(tenantId: string, value: communityCommunityApi.Forum): StoredRecord {
  return { tenantId, recordId: value.forumId, kind: "forum",
    document: communityCommunityApi.Forum.toJSON(value) };
}

export function fromForumRecord(record: StoredRecord): communityCommunityApi.Forum {
  return communityCommunityApi.Forum.fromJSON(record.document);
}

/**
 * Map moderation API values to the database document boundary.
 */
export function toModerationRecord(tenantId: string, value: communityCommunityApi.Moderation): StoredRecord {
  return { tenantId, recordId: value.moderationId, kind: "moderation",
    document: communityCommunityApi.Moderation.toJSON(value) };
}

export function fromModerationRecord(record: StoredRecord): communityCommunityApi.Moderation {
  return communityCommunityApi.Moderation.fromJSON(record.document);
}

/**
 * Map post API values to the database document boundary.
 */
export function toPostRecord(tenantId: string, value: communityCommunityApi.Post): StoredRecord {
  return { tenantId, recordId: value.postId, kind: "post",
    document: communityCommunityApi.Post.toJSON(value) };
}

export function fromPostRecord(record: StoredRecord): communityCommunityApi.Post {
  return communityCommunityApi.Post.fromJSON(record.document);
}
