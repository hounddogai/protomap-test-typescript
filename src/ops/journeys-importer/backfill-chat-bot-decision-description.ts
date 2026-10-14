import * as campaignsCampaignAssetApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as yardsYardQueryServiceApi from "../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillChatBotDecisionDescription keeps of each ExplainChatBotDecision response. */
interface BackfillChatBotDecisionDescriptionRecord {
  description: string;
  message: string;
  status: string;
  chatBotId: string;
}

/** Where backfillChatBotDecisionDescription hands each record. */
interface BackfillChatBotDecisionDescriptionTarget {
  apply(record: BackfillChatBotDecisionDescriptionRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.TranslationJobValidationService. */
class BackfillChatBotDecisionDescriptionTranslationJobValidation implements BackfillChatBotDecisionDescriptionTarget {
  private readonly client: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotDecisionDescriptionRecord): Promise<void> {
    await call<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse>(
      (request, done) => this.client.previewTranslationJob(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest.fromPartial({ translationJobId: record.chatBotId, reason: record.message }));
  }
}

/** Hands records to acme.campaigns.v1.CampaignAssetApprovalService. */
class BackfillChatBotDecisionDescriptionCampaignAssetApproval implements BackfillChatBotDecisionDescriptionTarget {
  private readonly client: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotDecisionDescriptionRecord): Promise<void> {
    await call<campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse>(
      (request, done) => this.client.rejectCampaignAsset(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetRequest.fromPartial({ campaignAssetId: record.message, campaignAsset: { name: record.chatBotId }, details: { comment: record.description } }));
  }
}

/** Hands records to acme.yards.v1.YardQueryService. */
class BackfillChatBotDecisionDescriptionYardQuery implements BackfillChatBotDecisionDescriptionTarget {
  private readonly client: yardsYardQueryServiceApi.YardQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new yardsYardQueryServiceApi.YardQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotDecisionDescriptionRecord): Promise<void> {
    await call<yardsYardQueryServiceApi.FindYardsRequest, yardsYardQueryServiceApi.FindYardsResponse>(
      (request, done) => this.client.findYards(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      yardsYardQueryServiceApi.FindYardsRequest.fromPartial({ filter: { query: record.description, region: record.status }, orderBy: record.chatBotId }));
  }
}

/**
 * Reads acme.chat.v1.ChatBotValidationService/ExplainChatBotDecision and hands what it keeps to the sink of
 * its kind.
 */
export async function backfillChatBotDecisionDescription(runtime: Runtime): Promise<void> {
  const origin = new chatChatBotValidationServiceApi.ChatBotValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse>(
    (request, done) => origin.explainChatBotDecision(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest.fromPartial({ chatBotId: "default-backfill-chat-bot-decision-description" }));
  const row: BackfillChatBotDecisionDescriptionRecord = {
    description: found.chatBot?.description ?? "",
    message: found.result?.message ?? "",
    status: found.result?.status ?? "",
    chatBotId: text.normalize(found.chatBot?.chatBotId ?? ""),
  };
  const sinks: BackfillChatBotDecisionDescriptionTarget[] = [
    new BackfillChatBotDecisionDescriptionTranslationJobValidation(runtime),
    new BackfillChatBotDecisionDescriptionCampaignAssetApproval(runtime),
    new BackfillChatBotDecisionDescriptionYardQuery(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(row);
  }
}
