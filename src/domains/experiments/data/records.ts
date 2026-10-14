/**
 * Persistence mappings owned by the experiments team.
 */

import * as experimentsExperimentsApi from "../../../../.cache/proto/acme/experiments/v1/experiments.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map experiment API values to the database document boundary.
 */
export function toExperimentRecord(tenantId: string, value: experimentsExperimentsApi.Experiment): StoredRecord {
  return { tenantId, recordId: value.experimentId, kind: "experiment",
    document: experimentsExperimentsApi.Experiment.toJSON(value) };
}

export function fromExperimentRecord(record: StoredRecord): experimentsExperimentsApi.Experiment {
  return experimentsExperimentsApi.Experiment.fromJSON(record.document);
}

/**
 * Map exposure API values to the database document boundary.
 */
export function toExposureRecord(tenantId: string, value: experimentsExperimentsApi.Exposure): StoredRecord {
  return { tenantId, recordId: value.exposureId, kind: "exposure",
    document: experimentsExperimentsApi.Exposure.toJSON(value) };
}

export function fromExposureRecord(record: StoredRecord): experimentsExperimentsApi.Exposure {
  return experimentsExperimentsApi.Exposure.fromJSON(record.document);
}

/**
 * Map variant API values to the database document boundary.
 */
export function toVariantRecord(tenantId: string, value: experimentsExperimentsApi.Variant): StoredRecord {
  return { tenantId, recordId: value.variantId, kind: "variant",
    document: experimentsExperimentsApi.Variant.toJSON(value) };
}

export function fromVariantRecord(record: StoredRecord): experimentsExperimentsApi.Variant {
  return experimentsExperimentsApi.Variant.fromJSON(record.document);
}
