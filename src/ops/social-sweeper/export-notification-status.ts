import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as paymentsPaymentCalculationServiceApi from "../../../.cache/proto/acme/payments/v1/payment_calculation_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportNotificationStatus keeps of each RevertNotification response. */
interface ExportNotificationStatusRecord {
  status: string;
  notificationId: string;
  subject: string;
  correlationId: string;
}

/** Where exportNotificationStatus hands each record. */
interface ExportNotificationStatusSink {
  push(record: ExportNotificationStatusRecord): Promise<void>;
}

/** Hands records to acme.personalization.v1.AffinityApprovalService. */
class ExportNotificationStatusAffinityApproval implements ExportNotificationStatusSink {
  private readonly client: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportNotificationStatusRecord): Promise<void> {
    await retry(() => call<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse>(
      (request, done) => this.client.rejectAffinity(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationAffinityApprovalServiceApi.RejectAffinityRequest.fromPartial({ affinity: { kind: record.status }, details: { approverEmail: record.correlationId, comment: record.subject } })));
  }
}

/** Passes records to acme.payments.v1.PaymentCalculationService. */
class ExportNotificationStatusPaymentCalculation implements ExportNotificationStatusSink {
  private readonly client: paymentsPaymentCalculationServiceApi.PaymentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new paymentsPaymentCalculationServiceApi.PaymentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportNotificationStatusRecord): Promise<void> {
    await retry(() => call<paymentsPaymentCalculationServiceApi.QuotePaymentRequest, paymentsPaymentCalculationServiceApi.QuotePaymentResponse>(
      (request, done) => this.client.quotePayment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      paymentsPaymentCalculationServiceApi.QuotePaymentRequest.fromPartial({ reason: record.subject })));
  }
}

/** Passes records to acme.experiments.v1.ExperimentValidationService. */
class ExportNotificationStatusExperimentValidation implements ExportNotificationStatusSink {
  private readonly client: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportNotificationStatusRecord): Promise<void> {
    await call<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse>(
      (request, done) => this.client.previewExperiment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentValidationServiceApi.PreviewExperimentRequest.fromPartial({ details: { locale: record.subject }, experiment: { title: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportNotificationStatusLogOnly implements ExportNotificationStatusSink {
  async push(record: ExportNotificationStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverExportNotificationStatus(kind: string, record: ExportNotificationStatusRecord, runtime: Runtime): Promise<void> {
  let sink: ExportNotificationStatusSink = new ExportNotificationStatusLogOnly();
  switch (kind) {
    case "affinity-approval":
      sink = new ExportNotificationStatusAffinityApproval(runtime);
      break;
    case "payment-calculation":
      sink = new ExportNotificationStatusPaymentCalculation(runtime);
      break;
    case "experiment-validation":
      sink = new ExportNotificationStatusExperimentValidation(runtime);
      break;
  }
  await sink.push(record);
}

/**
 * Reads acme.notifications.v1.NotificationHistoryService/RevertNotification and hands what it keeps to the
 * sink of its kind.
 */
export async function exportNotificationStatus(runtime: Runtime): Promise<void> {
  const upstream = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsNotificationHistoryServiceApi.RevertNotificationRequest, notificationsNotificationHistoryServiceApi.RevertNotificationResponse>(
    (request, done) => upstream.revertNotification(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    notificationsNotificationHistoryServiceApi.RevertNotificationRequest.fromPartial({ reason: "default-export-notification-status" }));
  const row: ExportNotificationStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    notificationId: current.notification?.notificationId ?? "",
    subject: current.notification?.subject ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await deliverExportNotificationStatus("experiment-validation", row, runtime);
}
