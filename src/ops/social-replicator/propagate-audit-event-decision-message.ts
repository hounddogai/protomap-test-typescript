import * as auditAuditEventValidationServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as merchandisingCollectionQueryServiceApi from "../../../.cache/proto/acme/merchandising/v1/collection_query_service.js";
import * as toursTourServiceApi from "../../../.cache/proto/acme/tours/v1/tour_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateAuditEventDecisionMessage keeps of each ExplainAuditEventDecision response. */
interface PropagateAuditEventDecisionMessageRecord {
  message: string;
  auditEventId: string;
}

/** Where propagateAuditEventDecisionMessage hands each record. */
interface PropagateAuditEventDecisionMessageWriter {
  apply(record: PropagateAuditEventDecisionMessageRecord): Promise<void>;
}

/** Writes records to acme.experiments.v1.ExposureCalculationService. */
class PropagateAuditEventDecisionMessageExposureCalculation implements PropagateAuditEventDecisionMessageWriter {
  private readonly client: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateAuditEventDecisionMessageRecord): Promise<void> {
    await retry(() => call<experimentsExposureCalculationServiceApi.RecalculateExposuresRequest, experimentsExposureCalculationServiceApi.RecalculateExposuresResponse>(
      (request, done) => this.client.recalculateExposures(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExposureCalculationServiceApi.RecalculateExposuresRequest.fromPartial({ exposure: { source: record.auditEventId, correlationId: record.message } })));
  }
}

/** Passes records to acme.tours.v1.TourService. */
class PropagateAuditEventDecisionMessageTour implements PropagateAuditEventDecisionMessageWriter {
  private readonly client: toursTourServiceApi.TourServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new toursTourServiceApi.TourServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateAuditEventDecisionMessageRecord): Promise<void> {
    await retry(() => call<toursTourServiceApi.ListToursRequest, toursTourServiceApi.ListToursResponse>(
      (request, done) => this.client.listTours(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      toursTourServiceApi.ListToursRequest.fromPartial({ orderBy: record.message, filter: { query: record.auditEventId } })));
  }
}

/** Hands records to acme.merchandising.v1.CollectionQueryService. */
class PropagateAuditEventDecisionMessageCollectionQuery implements PropagateAuditEventDecisionMessageWriter {
  private readonly client: merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateAuditEventDecisionMessageRecord): Promise<void> {
    await retry(() => call<merchandisingCollectionQueryServiceApi.CountCollectionsRequest, merchandisingCollectionQueryServiceApi.CountCollectionsResponse>(
      (request, done) => this.client.countCollections(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      merchandisingCollectionQueryServiceApi.CountCollectionsRequest.fromPartial({ filter: { region: record.auditEventId, query: record.message } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateAuditEventDecisionMessageLogOnly implements PropagateAuditEventDecisionMessageWriter {
  async apply(record: PropagateAuditEventDecisionMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchPropagateAuditEventDecisionMessage(kind: string, record: PropagateAuditEventDecisionMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: PropagateAuditEventDecisionMessageRecord): Promise<void> => new PropagateAuditEventDecisionMessageLogOnly().apply(item);
  switch (kind) {
    case "exposure-calculation":
      write = (item) => new PropagateAuditEventDecisionMessageExposureCalculation(runtime).apply(item);
      break;
    case "tour":
      write = (item) => new PropagateAuditEventDecisionMessageTour(runtime).apply(item);
      break;
    case "collection-query":
      write = (item) => new PropagateAuditEventDecisionMessageCollectionQuery(runtime).apply(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.audit.v1.AuditEventValidationService/ExplainAuditEventDecision and hands what it keeps to the
 * sink of its kind.
 */
export async function propagateAuditEventDecisionMessage(runtime: Runtime): Promise<void> {
  const source = new auditAuditEventValidationServiceApi.AuditEventValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse>(
    (request, done) => source.explainAuditEventDecision(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest.fromPartial({ auditEventId: "live-propagate-audit-event-decision-message" })));
  const record: PropagateAuditEventDecisionMessageRecord = {
    message: reply.outcome?.message ?? "",
    auditEventId: reply.auditEvent?.auditEventId ?? "",
  };
  await dispatchPropagateAuditEventDecisionMessage("exposure-calculation", record, runtime);
}
