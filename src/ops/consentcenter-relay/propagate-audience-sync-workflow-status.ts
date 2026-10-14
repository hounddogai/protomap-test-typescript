import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as warehousingWarehouseServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateAudienceSyncWorkflowStatus keeps of each RetryAudienceSyncWorkflow response. */
interface PropagateAudienceSyncWorkflowStatusRecord {
  status: string;
  kind: string;
  message: string;
}

/** Where propagateAudienceSyncWorkflowStatus hands each record. */
interface PropagateAudienceSyncWorkflowStatusWriter {
  write(record: PropagateAudienceSyncWorkflowStatusRecord): Promise<void>;
}

/** Writes records to acme.warehousing.v1.WarehouseService. */
class PropagateAudienceSyncWorkflowStatusWarehouse implements PropagateAudienceSyncWorkflowStatusWriter {
  private readonly client: warehousingWarehouseServiceApi.WarehouseServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new warehousingWarehouseServiceApi.WarehouseServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateAudienceSyncWorkflowStatusRecord): Promise<void> {
    await call<warehousingWarehouseServiceApi.CreateWarehouseRequest, warehousingWarehouseServiceApi.CreateWarehouseResponse>(
      (request, done) => this.client.createWarehouse(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      warehousingWarehouseServiceApi.CreateWarehouseRequest.fromPartial({ warehouse: { name: record.status } }));
  }
}

/** Passes records to acme.webhooks.v1.WebhookDeliveryValidationService. */
class PropagateAudienceSyncWorkflowStatusWebhookDeliveryValidation implements PropagateAudienceSyncWorkflowStatusWriter {
  private readonly client: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateAudienceSyncWorkflowStatusRecord): Promise<void> {
    await call<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse>(
      (request, done) => this.client.checkWebhookDeliveryEligibility(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest.fromPartial({ webhookDelivery: { correlationId: record.message, kind: record.kind }, webhookDeliveryId: record.status }));
  }
}

/** Writes records to acme.notifications.v1.DeliveryAttemptExportService. */
class PropagateAudienceSyncWorkflowStatusDeliveryAttemptExport implements PropagateAudienceSyncWorkflowStatusWriter {
  private readonly client: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateAudienceSyncWorkflowStatusRecord): Promise<void> {
    await call<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>(
      (request, done) => this.client.listDeliveryAttemptExports(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest.fromPartial({ filter: { query: record.status }, orderBy: record.message, page: { pageToken: record.kind } }));
  }
}

/** Passes records to acme.notifications.v1.SubscriptionSyncService. */
class PropagateAudienceSyncWorkflowStatusSubscriptionSync implements PropagateAudienceSyncWorkflowStatusWriter {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateAudienceSyncWorkflowStatusRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateRequest, notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateResponse>(
      (request, done) => this.client.getSubscriptionSyncState(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateRequest.fromPartial({ subscriptionId: record.kind }));
  }
}

/**
 * Reads acme.audiences.v1.AudienceSyncWorkflowService/RetryAudienceSyncWorkflow and hands what it keeps to
 * the sink of its kind.
 */
export async function propagateAudienceSyncWorkflowStatus(runtime: Runtime): Promise<void> {
  const origin = new audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse>(
    (request, done) => origin.retryAudienceSyncWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowRequest.fromPartial({ reason: "live-propagate-audience-sync-workflow-status" }));
  const row: PropagateAudienceSyncWorkflowStatusRecord = {
    status: found.outcome?.status ?? "",
    kind: found.audienceSync?.kind ?? "",
    message: found.outcome?.message ?? "",
  };
  const sinks = new Map<string, PropagateAudienceSyncWorkflowStatusWriter>();
  sinks.set("warehouse", new PropagateAudienceSyncWorkflowStatusWarehouse(runtime));
  sinks.set("webhook-delivery-validation", new PropagateAudienceSyncWorkflowStatusWebhookDeliveryValidation(runtime));
  sinks.set("delivery-attempt-export", new PropagateAudienceSyncWorkflowStatusDeliveryAttemptExport(runtime));
  sinks.set("subscription-sync", new PropagateAudienceSyncWorkflowStatusSubscriptionSync(runtime));
  await sinks.get("webhook-delivery-validation")!.write(row);
}
