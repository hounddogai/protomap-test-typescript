import * as audiencesAudienceApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillAudienceId keeps of each SubmitAudience response. */
interface BackfillAudienceIdRecord {
  referenceId: string;
  description: string;
}

/** Where backfillAudienceId hands each record. */
interface BackfillAudienceIdWriter {
  apply(record: BackfillAudienceIdRecord): Promise<void>;
}

/** Sends records to acme.chat.v1.ChatBotLifecycleService. */
class BackfillAudienceIdChatBotLifecycle implements BackfillAudienceIdWriter {
  private readonly client: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillAudienceIdRecord): Promise<void> {
    await retry(() => call<chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest, chatChatBotLifecycleServiceApi.GetChatBotLifecycleResponse>(
      (request, done) => this.client.getChatBotLifecycle(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest.fromPartial({ chatBotId: record.description })));
  }
}

/** Writes records to acme.notifications.v1.NotificationHistoryService. */
class BackfillAudienceIdNotificationHistory implements BackfillAudienceIdWriter {
  private readonly client: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillAudienceIdRecord): Promise<void> {
    await call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(
      (request, done) => this.client.annotateNotificationVersion(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({ details: { authorEmail: record.referenceId } }));
  }
}

/** Passes records to acme.campaigns.v1.CampaignBudgetWorkflowService. */
class BackfillAudienceIdCampaignBudgetWorkflow implements BackfillAudienceIdWriter {
  private readonly client: campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillAudienceIdRecord): Promise<void> {
    await retry(() => call<campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse>(
      (request, done) => this.client.pauseCampaignBudgetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest.fromPartial({ reason: record.description })));
  }
}

/**
 * Reads acme.audiences.v1.AudienceApprovalService/SubmitAudience and hands what it keeps to the sink of its
 * kind.
 */
export async function backfillAudienceId(runtime: Runtime): Promise<void> {
  const source = new audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<audiencesAudienceApprovalServiceApi.SubmitAudienceRequest, audiencesAudienceApprovalServiceApi.SubmitAudienceResponse>(
    (request, done) => source.submitAudience(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    audiencesAudienceApprovalServiceApi.SubmitAudienceRequest.fromPartial({ audienceId: "live-backfill-audience-id" }));
  const kept: BackfillAudienceIdRecord = {
    referenceId: current.outcome?.referenceId ?? "",
    description: text.normalize(current.audience?.description ?? ""),
  };
  const sinks: BackfillAudienceIdWriter[] = [
    new BackfillAudienceIdChatBotLifecycle(runtime),
    new BackfillAudienceIdNotificationHistory(runtime),
    new BackfillAudienceIdCampaignBudgetWorkflow(runtime),
  ];
  await sinks[0]!.apply(kept);
}
