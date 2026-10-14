import * as customersConsentRecordCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncConsentRecordOptionsId keeps of each CompareConsentRecordOptions response. */
interface SyncConsentRecordOptionsIdRecord {
  correlationId: string;
  currencyCode: string;
  consentRecordId: string;
  kind: string;
}

/** Where syncConsentRecordOptionsId hands each record. */
interface SyncConsentRecordOptionsIdTarget {
  deliver(record: SyncConsentRecordOptionsIdRecord): Promise<void>;
}

/** Sends records to acme.media.v1.MediaAssetCalculationService. */
class SyncConsentRecordOptionsIdMediaAssetCalculation implements SyncConsentRecordOptionsIdTarget {
  private readonly client: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncConsentRecordOptionsIdRecord): Promise<void> {
    await call<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse>(
      (request, done) => this.client.estimateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest.fromPartial({ mediaAsset: { name: record.correlationId }, mediaAssetId: record.currencyCode }));
  }
}

/** Writes records to acme.notifications.v1.SubscriptionWorkflowService. */
class SyncConsentRecordOptionsIdSubscriptionWorkflow implements SyncConsentRecordOptionsIdTarget {
  private readonly client: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncConsentRecordOptionsIdRecord): Promise<void> {
    await call<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>(
      (request, done) => this.client.retrySubscriptionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest.fromPartial({ reason: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SyncConsentRecordOptionsIdLogOnly implements SyncConsentRecordOptionsIdTarget {
  async deliver(record: SyncConsentRecordOptionsIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchSyncConsentRecordOptionsId(kind: string, record: SyncConsentRecordOptionsIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: SyncConsentRecordOptionsIdRecord): Promise<void> => new SyncConsentRecordOptionsIdLogOnly().deliver(item);
  switch (kind) {
    case "media-asset-calculation":
      write = (item) => new SyncConsentRecordOptionsIdMediaAssetCalculation(runtime).deliver(item);
      break;
    case "subscription-workflow":
      write = (item) => new SyncConsentRecordOptionsIdSubscriptionWorkflow(runtime).deliver(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.customers.v1.ConsentRecordCalculationService/CompareConsentRecordOptions and hands what it keeps
 * to the sink of its kind.
 */
export async function syncConsentRecordOptionsId(runtime: Runtime): Promise<void> {
  const origin = new customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(
    (request, done) => origin.compareConsentRecordOptions(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({ consentRecordId: "live-sync-consent-record-options-id" }));
  const entry: SyncConsentRecordOptionsIdRecord = {
    correlationId: found.consentRecord?.correlationId ?? "",
    currencyCode: found.breakdown?.currencyCode ?? "",
    consentRecordId: text.normalize(found.consentRecord?.consentRecordId ?? ""),
    kind: found.consentRecord?.kind ?? "",
  };
  await dispatchSyncConsentRecordOptionsId("media-asset-calculation", entry, runtime);
}
