import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as customersPreferenceValidationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayNotificationSubject keeps of each PushNotification response. */
interface ReplayNotificationSubjectRecord {
  subject: string;
  message: string;
}

/** Where replayNotificationSubject hands each record. */
interface ReplayNotificationSubjectWriter {
  push(record: ReplayNotificationSubjectRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.SubscriptionNotificationService. */
class ReplayNotificationSubjectSubscriptionNotification implements ReplayNotificationSubjectWriter {
  private readonly client: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayNotificationSubjectRecord): Promise<void> {
    await call<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse>(
      (request, done) => this.client.notifySubscriptionWatchers(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest.fromPartial({ details: { channel: record.message, templateId: record.subject } }));
  }
}

/** Sends records to acme.audiences.v1.AudienceMemberWorkflowService. */
class ReplayNotificationSubjectAudienceMemberWorkflow implements ReplayNotificationSubjectWriter {
  private readonly client: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayNotificationSubjectRecord): Promise<void> {
    await retry(() => call<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse>(
      (request, done) => this.client.signalAudienceMemberWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest.fromPartial({ reason: record.subject, details: { step: record.message } })));
  }
}

/** Sends records to acme.customers.v1.PreferenceValidationService. */
class ReplayNotificationSubjectPreferenceValidation implements ReplayNotificationSubjectWriter {
  private readonly client: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceValidationServiceApi.PreferenceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayNotificationSubjectRecord): Promise<void> {
    await retry(() => call<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse>(
      (request, done) => this.client.previewPreference(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      customersPreferenceValidationServiceApi.PreviewPreferenceRequest.fromPartial({ preference: { description: record.subject, name: record.message } })));
  }
}

/**
 * Reads acme.notifications.v1.NotificationSyncService/PushNotification and hands what it keeps to the sink of
 * its kind.
 */
export async function replayNotificationSubject(runtime: Runtime): Promise<void> {
  const source = new notificationsNotificationSyncServiceApi.NotificationSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(
    (request, done) => source.pushNotification(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({ notificationId: "default-replay-notification-subject" }));
  const row: ReplayNotificationSubjectRecord = {
    subject: reply.notification?.subject ?? "",
    message: reply.result?.message ?? "",
  };
  const sinks: ReplayNotificationSubjectWriter[] = [
    new ReplayNotificationSubjectSubscriptionNotification(runtime),
    new ReplayNotificationSubjectAudienceMemberWorkflow(runtime),
    new ReplayNotificationSubjectPreferenceValidation(runtime),
  ];
  await sinks[1]!.push(row);
}
