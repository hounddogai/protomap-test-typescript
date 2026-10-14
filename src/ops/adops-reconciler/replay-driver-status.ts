import * as communityBadgeApprovalServiceApi from "../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as driversDriverQueryServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_query_service.js";
import * as invoicingInvoiceBatchCalculationServiceApi from "../../../.cache/proto/acme/invoicing/v1/invoice_batch_calculation_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayDriverStatus keeps of each LookupDriver response. */
interface ReplayDriverStatusRecord {
  status: string;
  message: string;
}

/** Where replayDriverStatus hands each record. */
interface ReplayDriverStatusDestination {
  send(record: ReplayDriverStatusRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.NotificationTemplateAdminService. */
class ReplayDriverStatusNotificationTemplateAdmin implements ReplayDriverStatusDestination {
  private readonly client: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayDriverStatusRecord): Promise<void> {
    await retry(() => call<notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse>(
      (request, done) => this.client.reassignNotificationTemplate(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateRequest.fromPartial({ reason: record.status, notificationTemplateId: record.message })));
  }
}

/** Writes records to acme.invoicing.v1.InvoiceBatchCalculationService. */
class ReplayDriverStatusInvoiceBatchCalculation implements ReplayDriverStatusDestination {
  private readonly client: invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayDriverStatusRecord): Promise<void> {
    await call<invoicingInvoiceBatchCalculationServiceApi.CalculateInvoiceBatchRequest, invoicingInvoiceBatchCalculationServiceApi.CalculateInvoiceBatchResponse>(
      (request, done) => this.client.calculateInvoiceBatch(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      invoicingInvoiceBatchCalculationServiceApi.CalculateInvoiceBatchRequest.fromPartial({ invoiceBatch: { notes: record.message, number: record.status } }));
  }
}

/** Passes records to acme.community.v1.BadgeApprovalService. */
class ReplayDriverStatusBadgeApproval implements ReplayDriverStatusDestination {
  private readonly client: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeApprovalServiceApi.BadgeApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayDriverStatusRecord): Promise<void> {
    await retry(() => call<communityBadgeApprovalServiceApi.RecallBadgeRequest, communityBadgeApprovalServiceApi.RecallBadgeResponse>(
      (request, done) => this.client.recallBadge(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityBadgeApprovalServiceApi.RecallBadgeRequest.fromPartial({ reason: record.message, badge: { description: record.status } })));
  }
}

/** Runs the action registered for kind. */
async function actOnReplayDriverStatus(kind: string, record: ReplayDriverStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "notification-template-admin": () => new ReplayDriverStatusNotificationTemplateAdmin(runtime).send(record),
    "invoice-batch-calculation": () => new ReplayDriverStatusInvoiceBatchCalculation(runtime).send(record),
    "badge-approval": () => new ReplayDriverStatusBadgeApproval(runtime).send(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/** Reads acme.drivers.v1.DriverQueryService/LookupDriver and hands what it keeps to the sink of its kind. */
export async function replayDriverStatus(runtime: Runtime): Promise<void> {
  const source = new driversDriverQueryServiceApi.DriverQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<driversDriverQueryServiceApi.LookupDriverRequest, driversDriverQueryServiceApi.LookupDriverResponse>(
    (request, done) => source.lookupDriver(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    driversDriverQueryServiceApi.LookupDriverRequest.fromPartial({ driverId: "nightly-replay-driver-status" }));
  const entry: ReplayDriverStatusRecord = {
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  await actOnReplayDriverStatus("badge-approval", entry, runtime);
}
