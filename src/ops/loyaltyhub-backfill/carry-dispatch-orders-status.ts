import * as communityModerationApprovalServiceApi from "../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryDispatchOrdersStatus keeps of each CountDispatchOrders response. */
interface CarryDispatchOrdersStatusRecord {
  status: string;
  message: string;
  correlationId: string;
}

/** Where carryDispatchOrdersStatus hands each record. */
interface CarryDispatchOrdersStatusSink {
  send(record: CarryDispatchOrdersStatusRecord): Promise<void>;
}

/** Writes records to acme.personalization.v1.AffinitySyncService. */
class CarryDispatchOrdersStatusAffinitySync implements CarryDispatchOrdersStatusSink {
  private readonly client: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinitySyncServiceApi.AffinitySyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryDispatchOrdersStatusRecord): Promise<void> {
    await call<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>(
      (request, done) => this.client.reconcileAffinities(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest.fromPartial({ affinityId: record.message, details: { resolution: record.status }, affinity: { kind: record.correlationId } }));
  }
}

/** Passes records to acme.community.v1.ModerationApprovalService. */
class CarryDispatchOrdersStatusModerationApproval implements CarryDispatchOrdersStatusSink {
  private readonly client: communityModerationApprovalServiceApi.ModerationApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationApprovalServiceApi.ModerationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryDispatchOrdersStatusRecord): Promise<void> {
    await call<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse>(
      (request, done) => this.client.approveModeration(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityModerationApprovalServiceApi.ApproveModerationRequest.fromPartial({ reason: record.status, moderationId: record.correlationId }));
  }
}

/** Sends records to acme.notifications.v1.DeliveryAttemptNotificationService. */
class CarryDispatchOrdersStatusDeliveryAttemptNotification implements CarryDispatchOrdersStatusSink {
  private readonly client: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryDispatchOrdersStatusRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse>(
      (request, done) => this.client.notifyDeliveryAttemptWatchers(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest.fromPartial({ details: { templateId: record.status } })));
  }
}

/**
 * Reads acme.dispatch.v1.DispatchOrderQueryService/CountDispatchOrders and hands what it keeps to the sink of
 * its kind.
 */
export async function carryDispatchOrdersStatus(runtime: Runtime): Promise<void> {
  const source = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersResponse>(
    (request, done) => source.countDispatchOrders(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    dispatchDispatchOrderQueryServiceApi.CountDispatchOrdersRequest.fromPartial({ orderBy: "nightly-carry-dispatch-orders-status" }));
  const row: CarryDispatchOrdersStatusRecord = {
    status: response.result?.status ?? "",
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: CarryDispatchOrdersStatusSink[] = [
    new CarryDispatchOrdersStatusAffinitySync(runtime),
    new CarryDispatchOrdersStatusModerationApproval(runtime),
    new CarryDispatchOrdersStatusDeliveryAttemptNotification(runtime),
  ];
  await sinks[2]!.send(row);
}
