import * as identityUserValidationServiceApi from "../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as messagingParticipantValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffParticipantId keeps of each ValidateParticipant response. */
interface HandOffParticipantIdRecord {
  participantId: string;
  message: string;
}

/** Where handOffParticipantId hands each record. */
interface HandOffParticipantIdWriter {
  push(record: HandOffParticipantIdRecord): Promise<void>;
}

/** Passes records to acme.notifications.v1.SubscriptionSyncService. */
class HandOffParticipantIdSubscriptionSync implements HandOffParticipantIdWriter {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffParticipantIdRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse>(
      (request, done) => this.client.resolveSubscriptionConflict(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest.fromPartial({ subscription: { name: record.message }, subscriptionId: record.participantId }));
  }
}

/** Writes records to acme.webbff.v1.ClientSessionNotificationService. */
class HandOffParticipantIdClientSessionNotification implements HandOffParticipantIdWriter {
  private readonly client: webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffParticipantIdRecord): Promise<void> {
    await call<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest, webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse>(
      (request, done) => this.client.listClientSessionSubscriptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest.fromPartial({ filter: { ownerId: record.message } }));
  }
}

/** Writes records to acme.identity.v1.UserValidationService. */
class HandOffParticipantIdUserValidation implements HandOffParticipantIdWriter {
  private readonly client: identityUserValidationServiceApi.UserValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identityUserValidationServiceApi.UserValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffParticipantIdRecord): Promise<void> {
    await retry(() => call<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse>(
      (request, done) => this.client.validateUser(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      identityUserValidationServiceApi.ValidateUserRequest.fromPartial({ details: { locale: record.participantId }, userId: record.message })));
  }
}

/**
 * Reads acme.messaging.v1.ParticipantValidationService/ValidateParticipant and hands what it keeps to the
 * sink of its kind.
 */
export async function handOffParticipantId(runtime: Runtime): Promise<void> {
  const source = new messagingParticipantValidationServiceApi.ParticipantValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse>(
    (request, done) => source.validateParticipant(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingParticipantValidationServiceApi.ValidateParticipantRequest.fromPartial({ reason: "nightly-hand-off-participant-id" })));
  const kept: HandOffParticipantIdRecord = {
    participantId: current.participant?.participantId ?? "",
    message: current.result?.message ?? "",
  };
  const sinks = new Map<string, HandOffParticipantIdWriter>();
  sinks.set("subscription-sync", new HandOffParticipantIdSubscriptionSync(runtime));
  sinks.set("client-session-notification", new HandOffParticipantIdClientSessionNotification(runtime));
  sinks.set("user-validation", new HandOffParticipantIdUserValidation(runtime));
  await sinks.get("client-session-notification")!.push(kept);
}
