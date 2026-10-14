import * as careplansCarePlanQueryServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_query_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsVariantReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncMediaAssetId keeps of each SuspendMediaAsset response. */
interface SyncMediaAssetIdRecord {
  referenceId: string;
  correlationId: string;
}

/** Where syncMediaAssetId hands each record. */
interface SyncMediaAssetIdDestination {
  forward(record: SyncMediaAssetIdRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.VariantReportingService. */
class SyncMediaAssetIdVariantReporting implements SyncMediaAssetIdDestination {
  private readonly client: experimentsVariantReportingServiceApi.VariantReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantReportingServiceApi.VariantReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMediaAssetIdRecord): Promise<void> {
    await call<experimentsVariantReportingServiceApi.FetchVariantReportRequest, experimentsVariantReportingServiceApi.FetchVariantReportResponse>(
      (request, done) => this.client.fetchVariantReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsVariantReportingServiceApi.FetchVariantReportRequest.fromPartial({ variantId: record.referenceId }));
  }
}

/** Sends records to acme.messaging.v1.ConversationQueryService. */
class SyncMediaAssetIdConversationQuery implements SyncMediaAssetIdDestination {
  private readonly client: messagingConversationQueryServiceApi.ConversationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMediaAssetIdRecord): Promise<void> {
    await retry(() => call<messagingConversationQueryServiceApi.PeekConversationRequest, messagingConversationQueryServiceApi.PeekConversationResponse>(
      (request, done) => this.client.peekConversation(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingConversationQueryServiceApi.PeekConversationRequest.fromPartial({ conversationId: record.referenceId })));
  }
}

/** Hands records to acme.careplans.v1.CarePlanQueryService. */
class SyncMediaAssetIdCarePlanQuery implements SyncMediaAssetIdDestination {
  private readonly client: careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMediaAssetIdRecord): Promise<void> {
    await retry(() => call<careplansCarePlanQueryServiceApi.SuggestCarePlansRequest, careplansCarePlanQueryServiceApi.SuggestCarePlansResponse>(
      (request, done) => this.client.suggestCarePlans(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      careplansCarePlanQueryServiceApi.SuggestCarePlansRequest.fromPartial({ filter: { query: record.referenceId }, orderBy: record.correlationId })));
  }
}

/** Passes records to acme.experiments.v1.ExperimentApprovalService. */
class SyncMediaAssetIdExperimentApproval implements SyncMediaAssetIdDestination {
  private readonly client: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMediaAssetIdRecord): Promise<void> {
    await call<experimentsExperimentApprovalServiceApi.RecallExperimentRequest, experimentsExperimentApprovalServiceApi.RecallExperimentResponse>(
      (request, done) => this.client.recallExperiment(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentApprovalServiceApi.RecallExperimentRequest.fromPartial({ experiment: { experimentId: record.referenceId, title: record.correlationId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnSyncMediaAssetId(kind: string, record: SyncMediaAssetIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "variant-reporting": () => new SyncMediaAssetIdVariantReporting(runtime).forward(record),
    "conversation-query": () => new SyncMediaAssetIdConversationQuery(runtime).forward(record),
    "care-plan-query": () => new SyncMediaAssetIdCarePlanQuery(runtime).forward(record),
    "experiment-approval": () => new SyncMediaAssetIdExperimentApproval(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.MediaAssetLifecycleService/SuspendMediaAsset and hands what it keeps to the sink of its
 * kind.
 */
export async function syncMediaAssetId(runtime: Runtime): Promise<void> {
  const source = new mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse>(
    (request, done) => source.suspendMediaAsset(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetRequest.fromPartial({ reason: "live-sync-media-asset-id" })));
  const row: SyncMediaAssetIdRecord = {
    referenceId: text.normalize(current.outcome?.referenceId ?? ""),
    correlationId: text.normalize(current.result?.correlationId ?? ""),
  };
  await actOnSyncMediaAssetId("experiment-approval", row, runtime);
}
