import * as customersPreferenceValidationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportMediaAssetId keeps of each SubmitMediaAsset response. */
interface ExportMediaAssetIdRecord {
  mediaAssetId: string;
  status: string;
  referenceId: string;
  correlationId: string;
}

/** Where exportMediaAssetId hands each record. */
interface ExportMediaAssetIdTarget {
  deliver(record: ExportMediaAssetIdRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ChatMessageSyncService. */
class ExportMediaAssetIdChatMessageSync implements ExportMediaAssetIdTarget {
  private readonly client: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportMediaAssetIdRecord): Promise<void> {
    await call<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse>(
      (request, done) => this.client.listChatMessageConflicts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest.fromPartial({ orderBy: record.correlationId, filter: { query: record.referenceId, ownerId: record.status } }));
  }
}

/** Passes records to acme.customers.v1.PreferenceValidationService. */
class ExportMediaAssetIdPreferenceValidation implements ExportMediaAssetIdTarget {
  private readonly client: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceValidationServiceApi.PreferenceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportMediaAssetIdRecord): Promise<void> {
    await call<customersPreferenceValidationServiceApi.GetPreferenceRulesRequest, customersPreferenceValidationServiceApi.GetPreferenceRulesResponse>(
      (request, done) => this.client.getPreferenceRules(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      customersPreferenceValidationServiceApi.GetPreferenceRulesRequest.fromPartial({ preferenceId: record.correlationId }));
  }
}

/**
 * Reads acme.media.v1.MediaAssetApprovalService/SubmitMediaAsset and hands what it keeps to the sink of its
 * kind.
 */
export async function exportMediaAssetId(runtime: Runtime): Promise<void> {
  const upstream = new mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaMediaAssetApprovalServiceApi.SubmitMediaAssetRequest, mediaMediaAssetApprovalServiceApi.SubmitMediaAssetResponse>(
    (request, done) => upstream.submitMediaAsset(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetApprovalServiceApi.SubmitMediaAssetRequest.fromPartial({ reason: "nightly-export-media-asset-id" }));
  const kept: ExportMediaAssetIdRecord = {
    mediaAssetId: reply.mediaAsset?.mediaAssetId ?? "",
    status: text.normalize(reply.outcome?.status ?? ""),
    referenceId: reply.outcome?.referenceId ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const sinks: ExportMediaAssetIdTarget[] = [
    new ExportMediaAssetIdChatMessageSync(runtime),
    new ExportMediaAssetIdPreferenceValidation(runtime),
  ];
  await sinks[1]!.deliver(kept);
}
