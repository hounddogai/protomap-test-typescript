/**
 * Persistence mappings owned by the localization team.
 */

import * as localizationLocalizationApi from "../../../../.cache/proto/acme/localization/v1/localization.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map locale API values to the database document boundary.
 */
export function toLocaleRecord(tenantId: string, value: localizationLocalizationApi.Locale): StoredRecord {
  return { tenantId, recordId: value.localeId, kind: "locale",
    document: localizationLocalizationApi.Locale.toJSON(value) };
}

export function fromLocaleRecord(record: StoredRecord): localizationLocalizationApi.Locale {
  return localizationLocalizationApi.Locale.fromJSON(record.document);
}

/**
 * Map translation job API values to the database document boundary.
 */
export function toTranslationJobRecord(tenantId: string, value: localizationLocalizationApi.TranslationJob): StoredRecord {
  return { tenantId, recordId: value.translationJobId, kind: "translation_job",
    document: localizationLocalizationApi.TranslationJob.toJSON(value) };
}

export function fromTranslationJobRecord(record: StoredRecord): localizationLocalizationApi.TranslationJob {
  return localizationLocalizationApi.TranslationJob.fromJSON(record.document);
}

/**
 * Map translation key API values to the database document boundary.
 */
export function toTranslationKeyRecord(tenantId: string, value: localizationLocalizationApi.TranslationKey): StoredRecord {
  return { tenantId, recordId: value.translationKeyId, kind: "translation_key",
    document: localizationLocalizationApi.TranslationKey.toJSON(value) };
}

export function fromTranslationKeyRecord(record: StoredRecord): localizationLocalizationApi.TranslationKey {
  return localizationLocalizationApi.TranslationKey.fromJSON(record.document);
}
