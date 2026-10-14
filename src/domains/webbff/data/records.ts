/**
 * Persistence mappings owned by the webbff team.
 */

import * as webbffWebbffApi from "../../../../.cache/proto/acme/webbff/v1/webbff.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map client session API values to the database document boundary.
 */
export function toClientSessionRecord(tenantId: string, value: webbffWebbffApi.ClientSession): StoredRecord {
  return { tenantId, recordId: value.clientSessionId, kind: "client_session",
    document: webbffWebbffApi.ClientSession.toJSON(value) };
}

export function fromClientSessionRecord(record: StoredRecord): webbffWebbffApi.ClientSession {
  return webbffWebbffApi.ClientSession.fromJSON(record.document);
}

/**
 * Map page composition API values to the database document boundary.
 */
export function toPageCompositionRecord(tenantId: string, value: webbffWebbffApi.PageComposition): StoredRecord {
  return { tenantId, recordId: value.pageCompositionId, kind: "page_composition",
    document: webbffWebbffApi.PageComposition.toJSON(value) };
}

export function fromPageCompositionRecord(record: StoredRecord): webbffWebbffApi.PageComposition {
  return webbffWebbffApi.PageComposition.fromJSON(record.document);
}

/**
 * Map widget layout API values to the database document boundary.
 */
export function toWidgetLayoutRecord(tenantId: string, value: webbffWebbffApi.WidgetLayout): StoredRecord {
  return { tenantId, recordId: value.widgetLayoutId, kind: "widget_layout",
    document: webbffWebbffApi.WidgetLayout.toJSON(value) };
}

export function fromWidgetLayoutRecord(record: StoredRecord): webbffWebbffApi.WidgetLayout {
  return webbffWebbffApi.WidgetLayout.fromJSON(record.document);
}
