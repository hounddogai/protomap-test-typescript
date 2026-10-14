/**
 * Persistence mappings owned by the forms team.
 */

import * as formsFormsApi from "../../../../.cache/proto/acme/forms/v1/forms.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map form API values to the database document boundary.
 */
export function toFormRecord(tenantId: string, value: formsFormsApi.Form): StoredRecord {
  return { tenantId, recordId: value.formId, kind: "form",
    document: formsFormsApi.Form.toJSON(value) };
}

export function fromFormRecord(record: StoredRecord): formsFormsApi.Form {
  return formsFormsApi.Form.fromJSON(record.document);
}

/**
 * Map form field API values to the database document boundary.
 */
export function toFormFieldRecord(tenantId: string, value: formsFormsApi.FormField): StoredRecord {
  return { tenantId, recordId: value.formFieldId, kind: "form_field",
    document: formsFormsApi.FormField.toJSON(value) };
}

export function fromFormFieldRecord(record: StoredRecord): formsFormsApi.FormField {
  return formsFormsApi.FormField.fromJSON(record.document);
}

/**
 * Map form submission API values to the database document boundary.
 */
export function toFormSubmissionRecord(tenantId: string, value: formsFormsApi.FormSubmission): StoredRecord {
  return { tenantId, recordId: value.formSubmissionId, kind: "form_submission",
    document: formsFormsApi.FormSubmission.toJSON(value) };
}

export function fromFormSubmissionRecord(record: StoredRecord): formsFormsApi.FormSubmission {
  return formsFormsApi.FormSubmission.fromJSON(record.document);
}
