import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as mediaRenditionSyncServiceApi from "../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as procurementPurchaseRequisitionCalculationServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateDeliveryAttemptRulesKind keeps of each GetDeliveryAttemptRules response. */
interface PropagateDeliveryAttemptRulesKindRecord {
  kind: string;
  source: string;
}

/** Where propagateDeliveryAttemptRulesKind hands each record. */
interface PropagateDeliveryAttemptRulesKindTarget {
  apply(record: PropagateDeliveryAttemptRulesKindRecord): Promise<void>;
}

/** Passes records to acme.procurement.v1.PurchaseRequisitionCalculationService. */
class PropagateDeliveryAttemptRulesKindPurchaseRequisitionCalculation implements PropagateDeliveryAttemptRulesKindTarget {
  private readonly client: procurementPurchaseRequisitionCalculationServiceApi.PurchaseRequisitionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new procurementPurchaseRequisitionCalculationServiceApi.PurchaseRequisitionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateDeliveryAttemptRulesKindRecord): Promise<void> {
    await call<procurementPurchaseRequisitionCalculationServiceApi.ComparePurchaseRequisitionOptionsRequest, procurementPurchaseRequisitionCalculationServiceApi.ComparePurchaseRequisitionOptionsResponse>(
      (request, done) => this.client.comparePurchaseRequisitionOptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      procurementPurchaseRequisitionCalculationServiceApi.ComparePurchaseRequisitionOptionsRequest.fromPartial({ purchaseRequisition: { purchaseRequisitionId: record.kind } }));
  }
}

/** Hands records to acme.media.v1.RenditionSyncService. */
class PropagateDeliveryAttemptRulesKindRenditionSync implements PropagateDeliveryAttemptRulesKindTarget {
  private readonly client: mediaRenditionSyncServiceApi.RenditionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionSyncServiceApi.RenditionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateDeliveryAttemptRulesKindRecord): Promise<void> {
    await call<mediaRenditionSyncServiceApi.PullRenditionsRequest, mediaRenditionSyncServiceApi.PullRenditionsResponse>(
      (request, done) => this.client.pullRenditions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionSyncServiceApi.PullRenditionsRequest.fromPartial({ rendition: { name: record.source }, details: { resolution: record.kind } }));
  }
}

/** Passes records to acme.localization.v1.TranslationJobReportingService. */
class PropagateDeliveryAttemptRulesKindTranslationJobReporting implements PropagateDeliveryAttemptRulesKindTarget {
  private readonly client: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateDeliveryAttemptRulesKindRecord): Promise<void> {
    await retry(() => call<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse>(
      (request, done) => this.client.generateTranslationJobReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest.fromPartial({ details: { format: record.source } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateDeliveryAttemptRulesKindLogOnly implements PropagateDeliveryAttemptRulesKindTarget {
  async apply(record: PropagateDeliveryAttemptRulesKindRecord): Promise<void> {
    console.info("no sink for record", record.kind);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPropagateDeliveryAttemptRulesKind(kind: string, record: PropagateDeliveryAttemptRulesKindRecord, runtime: Runtime): Promise<void> {
  let sink: PropagateDeliveryAttemptRulesKindTarget = new PropagateDeliveryAttemptRulesKindLogOnly();
  switch (kind) {
    case "purchase-requisition-calculation":
      sink = new PropagateDeliveryAttemptRulesKindPurchaseRequisitionCalculation(runtime);
      break;
    case "rendition-sync":
      sink = new PropagateDeliveryAttemptRulesKindRenditionSync(runtime);
      break;
    case "translation-job-reporting":
      sink = new PropagateDeliveryAttemptRulesKindTranslationJobReporting(runtime);
      break;
  }
  await sink.apply(record);
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptValidationService/GetDeliveryAttemptRules and hands what it
 * keeps to the sink of its kind.
 */
export async function propagateDeliveryAttemptRulesKind(runtime: Runtime): Promise<void> {
  const reader = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest, notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesResponse>(
    (request, done) => reader.getDeliveryAttemptRules(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest.fromPartial({ deliveryAttemptId: "live-propagate-delivery-attempt-rules-kind" }));
  const row: PropagateDeliveryAttemptRulesKindRecord = {
    kind: text.normalize(current.deliveryAttempt?.kind ?? ""),
    source: current.deliveryAttempt?.source ?? "",
  };
  await deliverPropagateDeliveryAttemptRulesKind("rendition-sync", row, runtime);
}
