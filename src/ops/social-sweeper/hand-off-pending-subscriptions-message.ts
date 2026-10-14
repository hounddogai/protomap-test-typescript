import * as helpdeskTicketCalculationServiceApi from "../../../.cache/proto/acme/helpdesk/v1/ticket_calculation_service.js";
import * as identitySessionValidationServiceApi from "../../../.cache/proto/acme/identity/v1/session_validation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffPendingSubscriptionsMessage keeps of each ListPendingSubscriptions response. */
interface HandOffPendingSubscriptionsMessageRecord {
  message: string;
  nextPageToken: string;
  status: string;
}

/** Where handOffPendingSubscriptionsMessage hands each record. */
interface HandOffPendingSubscriptionsMessageTarget {
  push(record: HandOffPendingSubscriptionsMessageRecord): Promise<void>;
}

/** Writes records to acme.helpdesk.v1.TicketCalculationService. */
class HandOffPendingSubscriptionsMessageTicketCalculation implements HandOffPendingSubscriptionsMessageTarget {
  private readonly client: helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPendingSubscriptionsMessageRecord): Promise<void> {
    await retry(() => call<helpdeskTicketCalculationServiceApi.SimulateTicketRequest, helpdeskTicketCalculationServiceApi.SimulateTicketResponse>(
      (request, done) => this.client.simulateTicket(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      helpdeskTicketCalculationServiceApi.SimulateTicketRequest.fromPartial({ details: { currencyCode: record.nextPageToken }, reason: record.status, ticket: { ticketId: record.message } })));
  }
}

/** Passes records to acme.identity.v1.SessionValidationService. */
class HandOffPendingSubscriptionsMessageSessionValidation implements HandOffPendingSubscriptionsMessageTarget {
  private readonly client: identitySessionValidationServiceApi.SessionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identitySessionValidationServiceApi.SessionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPendingSubscriptionsMessageRecord): Promise<void> {
    await call<identitySessionValidationServiceApi.PreviewSessionRequest, identitySessionValidationServiceApi.PreviewSessionResponse>(
      (request, done) => this.client.previewSession(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      identitySessionValidationServiceApi.PreviewSessionRequest.fromPartial({ session: { sessionId: record.message } }));
  }
}

/** Hands records to acme.notifications.v1.NotificationCalculationService. */
class HandOffPendingSubscriptionsMessageNotificationCalculation implements HandOffPendingSubscriptionsMessageTarget {
  private readonly client: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPendingSubscriptionsMessageRecord): Promise<void> {
    await retry(() => call<notificationsNotificationCalculationServiceApi.SimulateNotificationRequest, notificationsNotificationCalculationServiceApi.SimulateNotificationResponse>(
      (request, done) => this.client.simulateNotification(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationCalculationServiceApi.SimulateNotificationRequest.fromPartial({ details: { currencyCode: record.nextPageToken } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffPendingSubscriptionsMessageLogOnly implements HandOffPendingSubscriptionsMessageTarget {
  async push(record: HandOffPendingSubscriptionsMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchHandOffPendingSubscriptionsMessage(kind: string, record: HandOffPendingSubscriptionsMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: HandOffPendingSubscriptionsMessageRecord): Promise<void> => new HandOffPendingSubscriptionsMessageLogOnly().push(item);
  switch (kind) {
    case "ticket-calculation":
      write = (item) => new HandOffPendingSubscriptionsMessageTicketCalculation(runtime).push(item);
      break;
    case "session-validation":
      write = (item) => new HandOffPendingSubscriptionsMessageSessionValidation(runtime).push(item);
      break;
    case "notification-calculation":
      write = (item) => new HandOffPendingSubscriptionsMessageNotificationCalculation(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.notifications.v1.SubscriptionApprovalService/ListPendingSubscriptions and hands what it keeps to
 * the sink of its kind.
 */
export async function handOffPendingSubscriptionsMessage(runtime: Runtime): Promise<void> {
  const origin = new notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>(
    (request, done) => origin.listPendingSubscriptions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest.fromPartial({ orderBy: "live-hand-off-pending-subscriptions-message" })));
  const row: HandOffPendingSubscriptionsMessageRecord = {
    message: current.result?.message ?? "",
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    status: current.result?.status ?? "",
  };
  await dispatchHandOffPendingSubscriptionsMessage("notification-calculation", row, runtime);
}
