import * as chatChatBotWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_workflow_service.js";
import * as communityBadgeLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as contentArticleServiceApi from "../../../.cache/proto/acme/content/v1/article_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayChatMessageReportsId keeps of each ListChatMessageReports response. */
interface ReplayChatMessageReportsIdRecord {
  correlationId: string;
  message: string;
  nextPageToken: string;
  status: string;
}

/** Where replayChatMessageReportsId hands each record. */
interface ReplayChatMessageReportsIdTarget {
  push(record: ReplayChatMessageReportsIdRecord): Promise<void>;
}

/** Writes records to acme.community.v1.BadgeLifecycleService. */
class ReplayChatMessageReportsIdBadgeLifecycle implements ReplayChatMessageReportsIdTarget {
  private readonly client: communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayChatMessageReportsIdRecord): Promise<void> {
    await retry(() => call<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse>(
      (request, done) => this.client.scheduleBadgeExpiry(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest.fromPartial({ badgeId: record.nextPageToken, badge: { description: record.correlationId, name: record.message } })));
  }
}

/** Writes records to acme.notifications.v1.DeliveryAttemptCalculationService. */
class ReplayChatMessageReportsIdDeliveryAttemptCalculation implements ReplayChatMessageReportsIdTarget {
  private readonly client: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayChatMessageReportsIdRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse>(
      (request, done) => this.client.recalculateDeliveryAttempts(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest.fromPartial({ reason: record.nextPageToken, deliveryAttempt: { kind: record.correlationId, correlationId: record.message } })));
  }
}

/** Hands records to acme.content.v1.ArticleService. */
class ReplayChatMessageReportsIdArticle implements ReplayChatMessageReportsIdTarget {
  private readonly client: contentArticleServiceApi.ArticleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleServiceApi.ArticleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayChatMessageReportsIdRecord): Promise<void> {
    await call<contentArticleServiceApi.SearchArticlesRequest, contentArticleServiceApi.SearchArticlesResponse>(
      (request, done) => this.client.searchArticles(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentArticleServiceApi.SearchArticlesRequest.fromPartial({ filter: { ownerId: record.correlationId } }));
  }
}

/** Passes records to acme.chat.v1.ChatBotWorkflowService. */
class ReplayChatMessageReportsIdChatBotWorkflow implements ReplayChatMessageReportsIdTarget {
  private readonly client: chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayChatMessageReportsIdRecord): Promise<void> {
    await call<chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse>(
      (request, done) => this.client.resumeChatBotWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowRequest.fromPartial({ chatBot: { name: record.correlationId }, chatBotId: record.message }));
  }
}

/**
 * Reads acme.messaging.v1.ChatMessageReportingService/ListChatMessageReports and hands what it keeps to the
 * sink of its kind.
 */
export async function replayChatMessageReportsId(runtime: Runtime): Promise<void> {
  const origin = new messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest, messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse>(
    (request, done) => origin.listChatMessageReports(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest.fromPartial({ orderBy: "primary-replay-chat-message-reports-id" })));
  const entry: ReplayChatMessageReportsIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
    status: found.result?.status ?? "",
  };
  const sinks = new Map<string, ReplayChatMessageReportsIdTarget>();
  sinks.set("badge-lifecycle", new ReplayChatMessageReportsIdBadgeLifecycle(runtime));
  sinks.set("delivery-attempt-calculation", new ReplayChatMessageReportsIdDeliveryAttemptCalculation(runtime));
  sinks.set("article", new ReplayChatMessageReportsIdArticle(runtime));
  sinks.set("chat-bot-workflow", new ReplayChatMessageReportsIdChatBotWorkflow(runtime));
  await sinks.get("badge-lifecycle")!.push(entry);
}
