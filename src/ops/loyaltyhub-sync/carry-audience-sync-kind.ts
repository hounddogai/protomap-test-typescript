import * as audiencesAudienceSyncLifecycleServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryAudienceSyncKind keeps of each SuspendAudienceSync response. */
interface CarryAudienceSyncKindRecord {
  kind: string;
  message: string;
}

/** Where carryAudienceSyncKind hands each record. */
interface CarryAudienceSyncKindWriter {
  push(record: CarryAudienceSyncKindRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.SubscriptionSyncService. */
class CarryAudienceSyncKindSubscriptionSync implements CarryAudienceSyncKindWriter {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryAudienceSyncKindRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
      (request, done) => this.client.listSubscriptionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({ filter: { ownerId: record.message } }));
  }
}

/** Hands records to acme.messaging.v1.ChatMessageLifecycleService. */
class CarryAudienceSyncKindChatMessageLifecycle implements CarryAudienceSyncKindWriter {
  private readonly client: messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryAudienceSyncKindRecord): Promise<void> {
    await call<messagingChatMessageLifecycleServiceApi.ReinstateChatMessageRequest, messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse>(
      (request, done) => this.client.reinstateChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageRequest.fromPartial({ chatMessageId: record.message, details: { reasonCode: record.kind } }));
  }
}

/** Hands records to acme.notifications.v1.DeliveryAttemptValidationService. */
class CarryAudienceSyncKindDeliveryAttemptValidation implements CarryAudienceSyncKindWriter {
  private readonly client: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryAudienceSyncKindRecord): Promise<void> {
    await call<notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest, notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesResponse>(
      (request, done) => this.client.getDeliveryAttemptRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest.fromPartial({ deliveryAttemptId: record.kind }));
  }
}

/**
 * Reads acme.audiences.v1.AudienceSyncLifecycleService/SuspendAudienceSync and hands what it keeps to the
 * sink of its kind.
 */
export async function carryAudienceSyncKind(runtime: Runtime): Promise<void> {
  const reader = new audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse>(
    (request, done) => reader.suspendAudienceSync(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest.fromPartial({ audienceSyncId: "nightly-carry-audience-sync-kind" }));
  const record: CarryAudienceSyncKindRecord = {
    kind: current.audienceSync?.kind ?? "",
    message: text.normalize(current.result?.message ?? ""),
  };
  const registry: Record<string, CarryAudienceSyncKindWriter> = {};
  for (const entry of [
    { kind: "subscription-sync", sink: new CarryAudienceSyncKindSubscriptionSync(runtime) },
    { kind: "chat-message-lifecycle", sink: new CarryAudienceSyncKindChatMessageLifecycle(runtime) },
    { kind: "delivery-attempt-validation", sink: new CarryAudienceSyncKindDeliveryAttemptValidation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["delivery-attempt-validation"]!.push(record);
}
