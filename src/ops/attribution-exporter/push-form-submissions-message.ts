import * as deliveriesDeliveryQueryServiceApi from "../../../.cache/proto/acme/deliveries/v1/delivery_query_service.js";
import * as experimentsExposureLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushFormSubmissionsMessage keeps of each FindFormSubmissions response. */
interface PushFormSubmissionsMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where pushFormSubmissionsMessage hands each record. */
interface PushFormSubmissionsMessageSink {
  write(record: PushFormSubmissionsMessageRecord): Promise<void>;
}

/** Sends records to acme.experiments.v1.ExposureLifecycleService. */
class PushFormSubmissionsMessageExposureLifecycle implements PushFormSubmissionsMessageSink {
  private readonly client: experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFormSubmissionsMessageRecord): Promise<void> {
    await call<experimentsExposureLifecycleServiceApi.TerminateExposureRequest, experimentsExposureLifecycleServiceApi.TerminateExposureResponse>(
      (request, done) => this.client.terminateExposure(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExposureLifecycleServiceApi.TerminateExposureRequest.fromPartial({ exposureId: record.message, reason: record.correlationId, details: { reasonCode: record.status } }));
  }
}

/** Sends records to acme.localization.v1.LocaleApprovalService. */
class PushFormSubmissionsMessageLocaleApproval implements PushFormSubmissionsMessageSink {
  private readonly client: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFormSubmissionsMessageRecord): Promise<void> {
    await call<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse>(
      (request, done) => this.client.commentLocaleApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest.fromPartial({ locale: { name: record.correlationId }, reason: record.status, details: { approverEmail: record.message } }));
  }
}

/** Hands records to acme.deliveries.v1.DeliveryQueryService. */
class PushFormSubmissionsMessageDeliveryQuery implements PushFormSubmissionsMessageSink {
  private readonly client: deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFormSubmissionsMessageRecord): Promise<void> {
    await retry(() => call<deliveriesDeliveryQueryServiceApi.BrowseDeliveriesRequest, deliveriesDeliveryQueryServiceApi.BrowseDeliveriesResponse>(
      (request, done) => this.client.browseDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      deliveriesDeliveryQueryServiceApi.BrowseDeliveriesRequest.fromPartial({ filter: { region: record.message, query: record.correlationId }, page: { pageToken: record.status } })));
  }
}

/** Writes records to acme.notifications.v1.NotificationAdminService. */
class PushFormSubmissionsMessageNotificationAdmin implements PushFormSubmissionsMessageSink {
  private readonly client: notificationsNotificationAdminServiceApi.NotificationAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationAdminServiceApi.NotificationAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFormSubmissionsMessageRecord): Promise<void> {
    await call<notificationsNotificationAdminServiceApi.ReassignNotificationRequest, notificationsNotificationAdminServiceApi.ReassignNotificationResponse>(
      (request, done) => this.client.reassignNotification(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationAdminServiceApi.ReassignNotificationRequest.fromPartial({ reason: record.message, details: { queue: record.status, assigneeEmail: record.correlationId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnPushFormSubmissionsMessage(kind: string, record: PushFormSubmissionsMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "exposure-lifecycle": () => new PushFormSubmissionsMessageExposureLifecycle(runtime).write(record),
    "locale-approval": () => new PushFormSubmissionsMessageLocaleApproval(runtime).write(record),
    "delivery-query": () => new PushFormSubmissionsMessageDeliveryQuery(runtime).write(record),
    "notification-admin": () => new PushFormSubmissionsMessageNotificationAdmin(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.forms.v1.FormSubmissionQueryService/FindFormSubmissions and hands what it keeps to the sink of
 * its kind.
 */
export async function pushFormSubmissionsMessage(runtime: Runtime): Promise<void> {
  const source = new formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<formsFormSubmissionQueryServiceApi.FindFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.FindFormSubmissionsResponse>(
    (request, done) => source.findFormSubmissions(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    formsFormSubmissionQueryServiceApi.FindFormSubmissionsRequest.fromPartial({ orderBy: "nightly-push-form-submissions-message" })));
  const kept: PushFormSubmissionsMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: current.result?.correlationId ?? "",
    status: text.normalize(current.result?.status ?? ""),
  };
  await actOnPushFormSubmissionsMessage("delivery-query", kept, runtime);
}
