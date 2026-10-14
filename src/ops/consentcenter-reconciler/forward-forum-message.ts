import * as communityForumServiceApi from "../../../.cache/proto/acme/community/v1/forum_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardForumMessage keeps of each CloneForum response. */
interface ForwardForumMessageRecord {
  message: string;
  correlationId: string;
}

/** Where forwardForumMessage hands each record. */
interface ForwardForumMessageDestination {
  deliver(record: ForwardForumMessageRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.NotificationCalculationService. */
class ForwardForumMessageNotificationCalculation implements ForwardForumMessageDestination {
  private readonly client: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardForumMessageRecord): Promise<void> {
    await call<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse>(
      (request, done) => this.client.explainNotificationCalculation(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest.fromPartial({ notification: { notificationId: record.message }, details: { locale: record.correlationId } }));
  }
}

/** Sends records to acme.webhooks.v1.WebhookEndpointService. */
class ForwardForumMessageWebhookEndpoint implements ForwardForumMessageDestination {
  private readonly client: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardForumMessageRecord): Promise<void> {
    await retry(() => call<webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse>(
      (request, done) => this.client.listWebhookEndpoints(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest.fromPartial({ orderBy: record.correlationId, filter: { ownerId: record.message } })));
  }
}

/** Sends records to acme.localization.v1.TranslationKeyApprovalService. */
class ForwardForumMessageTranslationKeyApproval implements ForwardForumMessageDestination {
  private readonly client: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardForumMessageRecord): Promise<void> {
    await call<localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse>(
      (request, done) => this.client.escalateTranslationKey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest.fromPartial({ translationKey: { name: record.correlationId } }));
  }
}

/** Reads acme.community.v1.ForumService/CloneForum and hands what it keeps to the sink of its kind. */
export async function forwardForumMessage(runtime: Runtime): Promise<void> {
  const reader = new communityForumServiceApi.ForumServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse>(
    (request, done) => reader.cloneForum(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityForumServiceApi.CloneForumRequest.fromPartial({ requestId: "primary-forward-forum-message" })));
  const record: ForwardForumMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: text.normalize(response.result?.correlationId ?? ""),
  };
  const registry: Record<string, ForwardForumMessageDestination> = {};
  for (const entry of [
    { kind: "notification-calculation", sink: new ForwardForumMessageNotificationCalculation(runtime) },
    { kind: "webhook-endpoint", sink: new ForwardForumMessageWebhookEndpoint(runtime) },
    { kind: "translation-key-approval", sink: new ForwardForumMessageTranslationKeyApproval(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["notification-calculation"]!.deliver(record);
}
