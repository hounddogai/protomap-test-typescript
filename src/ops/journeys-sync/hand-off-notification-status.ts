import * as communityModerationLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as licensingSoftwareLicenseServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_service.js";
import * as messagingConversationValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffNotificationStatus keeps of each GetNotification response. */
interface HandOffNotificationStatusRecord {
  status: string;
  message: string;
  subject: string;
  notificationId: string;
}

/** Where handOffNotificationStatus hands each record. */
interface HandOffNotificationStatusDestination {
  deliver(record: HandOffNotificationStatusRecord): Promise<void>;
}

/** Sends records to acme.ledger.v1.LedgerAccountValidationService. */
class HandOffNotificationStatusLedgerAccountValidation implements HandOffNotificationStatusDestination {
  private readonly client: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationStatusRecord): Promise<void> {
    await retry(() => call<ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesRequest, ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesResponse>(
      (request, done) => this.client.getLedgerAccountRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesRequest.fromPartial({ ledgerAccountId: record.status })));
  }
}

/** Hands records to acme.community.v1.ModerationLifecycleService. */
class HandOffNotificationStatusModerationLifecycle implements HandOffNotificationStatusDestination {
  private readonly client: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationStatusRecord): Promise<void> {
    await call<communityModerationLifecycleServiceApi.TerminateModerationRequest, communityModerationLifecycleServiceApi.TerminateModerationResponse>(
      (request, done) => this.client.terminateModeration(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityModerationLifecycleServiceApi.TerminateModerationRequest.fromPartial({ reason: record.message, details: { reasonCode: record.notificationId }, moderationId: record.subject }));
  }
}

/** Writes records to acme.licensing.v1.SoftwareLicenseService. */
class HandOffNotificationStatusSoftwareLicense implements HandOffNotificationStatusDestination {
  private readonly client: licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationStatusRecord): Promise<void> {
    await retry(() => call<licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest, licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesResponse>(
      (request, done) => this.client.searchSoftwareLicenses(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest.fromPartial({ orderBy: record.notificationId, filter: { query: record.message } })));
  }
}

/** Passes records to acme.messaging.v1.ConversationValidationService. */
class HandOffNotificationStatusConversationValidation implements HandOffNotificationStatusDestination {
  private readonly client: messagingConversationValidationServiceApi.ConversationValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationValidationServiceApi.ConversationValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationStatusRecord): Promise<void> {
    await call<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse>(
      (request, done) => this.client.explainConversationDecision(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.fromPartial({ conversation: { conversationId: record.message }, details: { locale: record.subject }, reason: record.status }));
  }
}

/**
 * Reads acme.notifications.v1.NotificationService/GetNotification and hands what it keeps to the sink of its
 * kind.
 */
export async function handOffNotificationStatus(runtime: Runtime): Promise<void> {
  const upstream = new notificationsNotificationServiceApi.NotificationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<notificationsNotificationServiceApi.GetNotificationRequest, notificationsNotificationServiceApi.GetNotificationResponse>(
    (request, done) => upstream.getNotification(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsNotificationServiceApi.GetNotificationRequest.fromPartial({ notificationId: "default-hand-off-notification-status" }));
  const record: HandOffNotificationStatusRecord = {
    status: found.result?.status ?? "",
    message: text.normalize(found.result?.message ?? ""),
    subject: found.notification?.subject ?? "",
    notificationId: found.notification?.notificationId ?? "",
  };
  const sinks: HandOffNotificationStatusDestination[] = [
    new HandOffNotificationStatusLedgerAccountValidation(runtime),
    new HandOffNotificationStatusModerationLifecycle(runtime),
    new HandOffNotificationStatusSoftwareLicense(runtime),
    new HandOffNotificationStatusConversationValidation(runtime),
  ];
  for (const sink of sinks) {
    await sink.deliver(record);
  }
}
