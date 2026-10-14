import * as audiencesAudienceMemberQueryServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as campaignsCampaignAssetQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardCampaignAssetName keeps of each PeekCampaignAsset response. */
interface ForwardCampaignAssetNameRecord {
  name: string;
  message: string;
  campaignAssetId: string;
}

/** Where forwardCampaignAssetName hands each record. */
interface ForwardCampaignAssetNameWriter {
  forward(record: ForwardCampaignAssetNameRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.VariantApprovalService. */
class ForwardCampaignAssetNameVariantApproval implements ForwardCampaignAssetNameWriter {
  private readonly client: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantApprovalServiceApi.VariantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetNameRecord): Promise<void> {
    await retry(() => call<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse>(
      (request, done) => this.client.delegateVariantApproval(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest.fromPartial({ reason: record.name, variant: { variantId: record.message }, variantId: record.campaignAssetId })));
  }
}

/** Sends records to acme.audiences.v1.AudienceMemberQueryService. */
class ForwardCampaignAssetNameAudienceMemberQuery implements ForwardCampaignAssetNameWriter {
  private readonly client: audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetNameRecord): Promise<void> {
    await call<audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersResponse>(
      (request, done) => this.client.suggestAudienceMembers(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersRequest.fromPartial({ filter: { region: record.message, query: record.campaignAssetId }, page: { pageToken: record.name } }));
  }
}

/** Passes records to acme.chat.v1.ChatBotValidationService. */
class ForwardCampaignAssetNameChatBotValidation implements ForwardCampaignAssetNameWriter {
  private readonly client: chatChatBotValidationServiceApi.ChatBotValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotValidationServiceApi.ChatBotValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardCampaignAssetNameRecord): Promise<void> {
    await call<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse>(
      (request, done) => this.client.validateChatBot(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotValidationServiceApi.ValidateChatBotRequest.fromPartial({ chatBotId: record.message, chatBot: { chatBotId: record.name, name: record.campaignAssetId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardCampaignAssetNameLogOnly implements ForwardCampaignAssetNameWriter {
  async forward(record: ForwardCampaignAssetNameRecord): Promise<void> {
    console.info("no sink for record", record.name);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverForwardCampaignAssetName(kind: string, record: ForwardCampaignAssetNameRecord, runtime: Runtime): Promise<void> {
  let sink: ForwardCampaignAssetNameWriter = new ForwardCampaignAssetNameLogOnly();
  switch (kind) {
    case "variant-approval":
      sink = new ForwardCampaignAssetNameVariantApproval(runtime);
      break;
    case "audience-member-query":
      sink = new ForwardCampaignAssetNameAudienceMemberQuery(runtime);
      break;
    case "chat-bot-validation":
      sink = new ForwardCampaignAssetNameChatBotValidation(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.campaigns.v1.CampaignAssetQueryService/PeekCampaignAsset and hands what it keeps to the sink of
 * its kind.
 */
export async function forwardCampaignAssetName(runtime: Runtime): Promise<void> {
  const source = new campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetRequest, campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetResponse>(
    (request, done) => source.peekCampaignAsset(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetRequest.fromPartial({ campaignAssetId: "main-forward-campaign-asset-name" })));
  const row: ForwardCampaignAssetNameRecord = {
    name: current.campaignAsset?.name ?? "",
    message: current.result?.message ?? "",
    campaignAssetId: current.campaignAsset?.campaignAssetId ?? "",
  };
  await deliverForwardCampaignAssetName("chat-bot-validation", row, runtime);
}
