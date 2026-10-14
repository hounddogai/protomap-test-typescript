import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as edgegatewayRouteBindingQueryServiceApi from "../../../.cache/proto/acme/edgegateway/v1/route_binding_query_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleRouteBindingsStatus keeps of each SummarizeRouteBindings response. */
interface SettleRouteBindingsStatusRecord {
  status: string;
  message: string;
}

/** Where settleRouteBindingsStatus hands each record. */
interface SettleRouteBindingsStatusTarget {
  send(record: SettleRouteBindingsStatusRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.NotificationSyncService. */
class SettleRouteBindingsStatusNotificationSync implements SettleRouteBindingsStatusTarget {
  private readonly client: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationSyncServiceApi.NotificationSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleRouteBindingsStatusRecord): Promise<void> {
    await call<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>(
      (request, done) => this.client.listNotificationConflicts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest.fromPartial({ page: { pageToken: record.message }, filter: { query: record.status } }));
  }
}

/** Sends records to acme.dispatch.v1.DispatchOrderQueryService. */
class SettleRouteBindingsStatusDispatchOrderQuery implements SettleRouteBindingsStatusTarget {
  private readonly client: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleRouteBindingsStatusRecord): Promise<void> {
    await call<dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersResponse>(
      (request, done) => this.client.countDispatchOrders(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersRequest.fromPartial({ filter: { query: record.status }, page: { pageToken: record.message } }));
  }
}

/** Writes records to acme.notifications.v1.DeliveryAttemptWorkflowService. */
class SettleRouteBindingsStatusDeliveryAttemptWorkflow implements SettleRouteBindingsStatusTarget {
  private readonly client: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleRouteBindingsStatusRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse>(
      (request, done) => this.client.signalDeliveryAttemptWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest.fromPartial({ details: { initiatedBy: record.status }, deliveryAttempt: { kind: record.message } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class SettleRouteBindingsStatusLogOnly implements SettleRouteBindingsStatusTarget {
  async send(record: SettleRouteBindingsStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSettleRouteBindingsStatus(kind: string, record: SettleRouteBindingsStatusRecord, runtime: Runtime): Promise<void> {
  let sink: SettleRouteBindingsStatusTarget = new SettleRouteBindingsStatusLogOnly();
  switch (kind) {
    case "notification-sync":
      sink = new SettleRouteBindingsStatusNotificationSync(runtime);
      break;
    case "dispatch-order-query":
      sink = new SettleRouteBindingsStatusDispatchOrderQuery(runtime);
      break;
    case "delivery-attempt-workflow":
      sink = new SettleRouteBindingsStatusDeliveryAttemptWorkflow(runtime);
      break;
  }
  await sink.send(record);
}

/**
 * Reads acme.edgegateway.v1.RouteBindingQueryService/SummarizeRouteBindings and hands what it keeps to the
 * sink of its kind.
 */
export async function settleRouteBindingsStatus(runtime: Runtime): Promise<void> {
  const reader = new edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsResponse>(
    (request, done) => reader.summarizeRouteBindings(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsRequest.fromPartial({ routeBindingId: "main-settle-route-bindings-status" }));
  const entry: SettleRouteBindingsStatusRecord = {
    status: response.result?.status ?? "",
    message: response.result?.message ?? "",
  };
  await deliverSettleRouteBindingsStatus("dispatch-order-query", entry, runtime);
}
