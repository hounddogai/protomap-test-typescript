import * as campaignsCampaignAssetQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as experimentsExposureSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as messagingChatMessageWorkflowServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardCampaignAssetsId keeps of each ResolveCampaignAssets response. */
interface ForwardCampaignAssetsIdRecord {
  correlationId: string;
  message: string;
}

/** Where forwardCampaignAssetsId hands each record. */
interface ForwardCampaignAssetsIdWriter {
  forward(record: ForwardCampaignAssetsIdRecord): Promise<void>;
}

/** Writes records to acme.content.v1.ContentRevisionApprovalService. */
class ForwardCampaignAssetsIdContentRevisionApproval implements ForwardCampaignAssetsIdWriter {
  private readonly client: contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetsIdRecord): Promise<void> {
    await call<contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusRequest, contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusResponse>(
      (request, done) => this.client.getContentRevisionApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusRequest.fromPartial({ contentRevisionId: record.correlationId }));
  }
}

/** Writes records to acme.experiments.v1.ExposureSyncService. */
class ForwardCampaignAssetsIdExposureSync implements ForwardCampaignAssetsIdWriter {
  private readonly client: experimentsExposureSyncServiceApi.ExposureSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureSyncServiceApi.ExposureSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetsIdRecord): Promise<void> {
    await call<experimentsExposureSyncServiceApi.ResolveExposureConflictRequest, experimentsExposureSyncServiceApi.ResolveExposureConflictResponse>(
      (request, done) => this.client.resolveExposureConflict(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExposureSyncServiceApi.ResolveExposureConflictRequest.fromPartial({ exposureId: record.message }));
  }
}

/** Writes records to acme.messaging.v1.ChatMessageWorkflowService. */
class ForwardCampaignAssetsIdChatMessageWorkflow implements ForwardCampaignAssetsIdWriter {
  private readonly client: messagingChatMessageWorkflowServiceApi.ChatMessageWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageWorkflowServiceApi.ChatMessageWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetsIdRecord): Promise<void> {
    await call<messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse>(
      (request, done) => this.client.retryChatMessageWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowRequest.fromPartial({ chatMessage: { kind: record.message } }));
  }
}

/**
 * Reads acme.campaigns.v1.CampaignAssetQueryService/ResolveCampaignAssets and hands what it keeps to the sink
 * of its kind.
 */
export async function forwardCampaignAssetsId(runtime: Runtime): Promise<void> {
  const origin = new campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsResponse>(
    (request, done) => origin.resolveCampaignAssets(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsRequest.fromPartial({})));
  const row: ForwardCampaignAssetsIdRecord = {
    correlationId: text.normalize(response.result?.correlationId ?? ""),
    message: response.result?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: ForwardCampaignAssetsIdWriter }> = [
    { kind: "content-revision-approval", sink: new ForwardCampaignAssetsIdContentRevisionApproval(runtime) },
    { kind: "exposure-sync", sink: new ForwardCampaignAssetsIdExposureSync(runtime) },
    { kind: "chat-message-workflow", sink: new ForwardCampaignAssetsIdChatMessageWorkflow(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "chat-message-workflow") continue;
    await entry.sink.forward(row);
  }
}
