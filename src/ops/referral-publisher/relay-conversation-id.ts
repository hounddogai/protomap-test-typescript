import * as communityBadgeApprovalServiceApi from "../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityModerationApprovalServiceApi from "../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayConversationId keeps of each PeekConversation response. */
interface RelayConversationIdRecord {
  correlationId: string;
  message: string;
  status: string;
  conversationId: string;
}

/** Where relayConversationId hands each record. */
interface RelayConversationIdDestination {
  apply(record: RelayConversationIdRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.NotificationTemplateQueryService. */
class RelayConversationIdNotificationTemplateQuery implements RelayConversationIdDestination {
  private readonly client: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayConversationIdRecord): Promise<void> {
    await call<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(
      (request, done) => this.client.browseNotificationTemplates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({ filter: { ownerId: record.correlationId, query: record.status } }));
  }
}

/** Passes records to acme.community.v1.ModerationApprovalService. */
class RelayConversationIdModerationApproval implements RelayConversationIdDestination {
  private readonly client: communityModerationApprovalServiceApi.ModerationApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationApprovalServiceApi.ModerationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayConversationIdRecord): Promise<void> {
    await retry(() => call<communityModerationApprovalServiceApi.EscalateModerationRequest, communityModerationApprovalServiceApi.EscalateModerationResponse>(
      (request, done) => this.client.escalateModeration(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityModerationApprovalServiceApi.EscalateModerationRequest.fromPartial({ moderation: { moderationId: record.status } })));
  }
}

/** Passes records to acme.community.v1.BadgeApprovalService. */
class RelayConversationIdBadgeApproval implements RelayConversationIdDestination {
  private readonly client: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeApprovalServiceApi.BadgeApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayConversationIdRecord): Promise<void> {
    await retry(() => call<communityBadgeApprovalServiceApi.ListPendingBadgesRequest, communityBadgeApprovalServiceApi.ListPendingBadgesResponse>(
      (request, done) => this.client.listPendingBadges(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityBadgeApprovalServiceApi.ListPendingBadgesRequest.fromPartial({ orderBy: record.conversationId, filter: { ownerId: record.message, region: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayConversationIdLogOnly implements RelayConversationIdDestination {
  async apply(record: RelayConversationIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRelayConversationId(kind: string, record: RelayConversationIdRecord, runtime: Runtime): Promise<void> {
  let sink: RelayConversationIdDestination = new RelayConversationIdLogOnly();
  switch (kind) {
    case "notification-template-query":
      sink = new RelayConversationIdNotificationTemplateQuery(runtime);
      break;
    case "moderation-approval":
      sink = new RelayConversationIdModerationApproval(runtime);
      break;
    case "badge-approval":
      sink = new RelayConversationIdBadgeApproval(runtime);
      break;
  }
  await sink.apply(record);
}

/**
 * Reads acme.messaging.v1.ConversationQueryService/PeekConversation and hands what it keeps to the sink of
 * its kind.
 */
export async function relayConversationId(runtime: Runtime): Promise<void> {
  const reader = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingConversationQueryServiceApi.PeekConversationRequest, messagingConversationQueryServiceApi.PeekConversationResponse>(
    (request, done) => reader.peekConversation(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingConversationQueryServiceApi.PeekConversationRequest.fromPartial({ conversationId: "live-relay-conversation-id" }));
  const record: RelayConversationIdRecord = {
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    message: current.result?.message ?? "",
    status: text.normalize(current.result?.status ?? ""),
    conversationId: current.conversation?.conversationId ?? "",
  };
  await deliverRelayConversationId("badge-approval", record, runtime);
}
