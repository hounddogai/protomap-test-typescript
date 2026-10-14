/**
 * Persistence mappings owned by the personalization team.
 */

import * as personalizationPersonalizationApi from "../../../../.cache/proto/acme/personalization/v1/personalization.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map affinity API values to the database document boundary.
 */
export function toAffinityRecord(tenantId: string, value: personalizationPersonalizationApi.Affinity): StoredRecord {
  return { tenantId, recordId: value.affinityId, kind: "affinity",
    document: personalizationPersonalizationApi.Affinity.toJSON(value) };
}

export function fromAffinityRecord(record: StoredRecord): personalizationPersonalizationApi.Affinity {
  return personalizationPersonalizationApi.Affinity.fromJSON(record.document);
}

/**
 * Map profile API values to the database document boundary.
 */
export function toProfileRecord(tenantId: string, value: personalizationPersonalizationApi.Profile): StoredRecord {
  return { tenantId, recordId: value.profileId, kind: "profile",
    document: personalizationPersonalizationApi.Profile.toJSON(value) };
}

export function fromProfileRecord(record: StoredRecord): personalizationPersonalizationApi.Profile {
  return personalizationPersonalizationApi.Profile.fromJSON(record.document);
}

/**
 * Map recommendation API values to the database document boundary.
 */
export function toRecommendationRecord(tenantId: string, value: personalizationPersonalizationApi.Recommendation): StoredRecord {
  return { tenantId, recordId: value.recommendationId, kind: "recommendation",
    document: personalizationPersonalizationApi.Recommendation.toJSON(value) };
}

export function fromRecommendationRecord(record: StoredRecord): personalizationPersonalizationApi.Recommendation {
  return personalizationPersonalizationApi.Recommendation.fromJSON(record.document);
}
