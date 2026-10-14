import * as chatChatBotReportingServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushContentRevisionApprovalId keeps of each DelegateContentRevisionApproval response. */
interface PushContentRevisionApprovalIdRecord {
  correlationId: string;
  source: string;
}

/** Where pushContentRevisionApprovalId hands each record. */
interface PushContentRevisionApprovalIdDestination {
  write(record: PushContentRevisionApprovalIdRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.NotificationTemplateNotificationService. */
class PushContentRevisionApprovalIdNotificationTemplateNotification implements PushContentRevisionApprovalIdDestination {
  private readonly client: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushContentRevisionApprovalIdRecord): Promise<void> {
    await call<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse>(
      (request, done) => this.client.listNotificationTemplateSubscriptions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.fromPartial({ filter: { ownerId: record.correlationId } }));
  }
}

/** Sends records to acme.chat.v1.ChatBotReportingService. */
class PushContentRevisionApprovalIdChatBotReporting implements PushContentRevisionApprovalIdDestination {
  private readonly client: chatChatBotReportingServiceApi.ChatBotReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotReportingServiceApi.ChatBotReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushContentRevisionApprovalIdRecord): Promise<void> {
    await call<chatChatBotReportingServiceApi.CountChatBotTotalsRequest, chatChatBotReportingServiceApi.CountChatBotTotalsResponse>(
      (request, done) => this.client.countChatBotTotals(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotReportingServiceApi.CountChatBotTotalsRequest.fromPartial({ filter: { query: record.correlationId } }));
  }
}

/**
 * Reads acme.content.v1.ContentRevisionApprovalService/DelegateContentRevisionApproval and hands what it
 * keeps to the sink of its kind.
 */
export async function pushContentRevisionApprovalId(runtime: Runtime): Promise<void> {
  const reader = new contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest, contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse>(
    (request, done) => reader.delegateContentRevisionApproval(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest.fromPartial({ contentRevisionId: "current-push-content-revision-approval-id" }));
  const row: PushContentRevisionApprovalIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    source: reply.contentRevision?.source ?? "",
  };
  const registry: Record<string, PushContentRevisionApprovalIdDestination> = {};
  for (const entry of [
    { kind: "notification-template-notification", sink: new PushContentRevisionApprovalIdNotificationTemplateNotification(runtime) },
    { kind: "chat-bot-reporting", sink: new PushContentRevisionApprovalIdChatBotReporting(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["notification-template-notification"]!.write(row);
}
