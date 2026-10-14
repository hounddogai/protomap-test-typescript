import * as formsFormFieldApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorLocaleWorkflowId keeps of each StartLocaleWorkflow response. */
interface MirrorLocaleWorkflowIdRecord {
  localeId: string;
  description: string;
  message: string;
}

/** Where mirrorLocaleWorkflowId hands each record. */
interface MirrorLocaleWorkflowIdDestination {
  apply(record: MirrorLocaleWorkflowIdRecord): Promise<void>;
}

/** Hands records to acme.forms.v1.FormFieldApprovalService. */
class MirrorLocaleWorkflowIdFormFieldApproval implements MirrorLocaleWorkflowIdDestination {
  private readonly client: formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorLocaleWorkflowIdRecord): Promise<void> {
    await call<formsFormFieldApprovalServiceApi.CommentFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse>(
      (request, done) => this.client.commentFormFieldApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormFieldApprovalServiceApi.CommentFormFieldApprovalRequest.fromPartial({ reason: record.localeId }));
  }
}

/** Writes records to acme.notifications.v1.NotificationCalculationService. */
class MirrorLocaleWorkflowIdNotificationCalculation implements MirrorLocaleWorkflowIdDestination {
  private readonly client: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorLocaleWorkflowIdRecord): Promise<void> {
    await call<notificationsNotificationCalculationServiceApi.SimulateNotificationRequest, notificationsNotificationCalculationServiceApi.SimulateNotificationResponse>(
      (request, done) => this.client.simulateNotification(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationCalculationServiceApi.SimulateNotificationRequest.fromPartial({ notification: { notificationId: record.message }, notificationId: record.localeId, details: { currencyCode: record.description } }));
  }
}

/**
 * Reads acme.localization.v1.LocaleWorkflowService/StartLocaleWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function mirrorLocaleWorkflowId(runtime: Runtime): Promise<void> {
  const upstream = new localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse>(
    (request, done) => upstream.startLocaleWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest.fromPartial({ localeId: "primary-mirror-locale-workflow-id" }));
  const record: MirrorLocaleWorkflowIdRecord = {
    localeId: found.locale?.localeId ?? "",
    description: found.locale?.description ?? "",
    message: found.result?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: MirrorLocaleWorkflowIdDestination }> = [
    { kind: "form-field-approval", sink: new MirrorLocaleWorkflowIdFormFieldApproval(runtime) },
    { kind: "notification-calculation", sink: new MirrorLocaleWorkflowIdNotificationCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "form-field-approval") continue;
    await entry.sink.apply(record);
  }
}
