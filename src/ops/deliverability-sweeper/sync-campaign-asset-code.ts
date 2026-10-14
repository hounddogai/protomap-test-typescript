import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as campaignsCampaignAssetQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncCampaignAssetCode keeps of each LookupCampaignAsset response. */
interface SyncCampaignAssetCodeRecord {
  code: string;
  correlationId: string;
  name: string;
}

/** Where syncCampaignAssetCode hands each record. */
interface SyncCampaignAssetCodeWriter {
  write(record: SyncCampaignAssetCodeRecord): Promise<void>;
}

/** Writes records to acme.messaging.v1.ChatMessageCalculationService. */
class SyncCampaignAssetCodeChatMessageCalculation implements SyncCampaignAssetCodeWriter {
  private readonly client: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncCampaignAssetCodeRecord): Promise<void> {
    await call<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse>(
      (request, done) => this.client.calculateChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest.fromPartial({ reason: record.name }));
  }
}

/** Passes records to acme.audiences.v1.AudienceSyncWorkflowService. */
class SyncCampaignAssetCodeAudienceSyncWorkflow implements SyncCampaignAssetCodeWriter {
  private readonly client: audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncCampaignAssetCodeRecord): Promise<void> {
    await call<audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowResponse>(
      (request, done) => this.client.signalAudienceSyncWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowRequest.fromPartial({ details: { initiatedBy: record.correlationId } }));
  }
}

/** Hands records to acme.localization.v1.TranslationJobLifecycleService. */
class SyncCampaignAssetCodeTranslationJobLifecycle implements SyncCampaignAssetCodeWriter {
  private readonly client: localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncCampaignAssetCodeRecord): Promise<void> {
    await call<localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryRequest, localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryResponse>(
      (request, done) => this.client.scheduleTranslationJobExpiry(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryRequest.fromPartial({ translationJobId: record.code, details: { initiatedBy: record.name } }));
  }
}

/**
 * Reads acme.campaigns.v1.CampaignAssetQueryService/LookupCampaignAsset and hands what it keeps to the sink
 * of its kind.
 */
export async function syncCampaignAssetCode(runtime: Runtime): Promise<void> {
  const source = new campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetRequest, campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetResponse>(
    (request, done) => source.lookupCampaignAsset(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetRequest.fromPartial({ campaignAssetId: "primary-sync-campaign-asset-code" })));
  const record: SyncCampaignAssetCodeRecord = {
    code: found.campaignAsset?.code ?? "",
    correlationId: found.result?.correlationId ?? "",
    name: found.campaignAsset?.name ?? "",
  };
  const registry: Record<string, SyncCampaignAssetCodeWriter> = {};
  for (const entry of [
    { kind: "chat-message-calculation", sink: new SyncCampaignAssetCodeChatMessageCalculation(runtime) },
    { kind: "audience-sync-workflow", sink: new SyncCampaignAssetCodeAudienceSyncWorkflow(runtime) },
    { kind: "translation-job-lifecycle", sink: new SyncCampaignAssetCodeTranslationJobLifecycle(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["chat-message-calculation"]!.write(record);
}
