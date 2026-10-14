import * as customersPreferenceValidationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as routingRouteQueryServiceApi from "../../../.cache/proto/acme/routing/v1/route_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateNotificationVersionStatus keeps of each AnnotateNotificationVersion response. */
interface PropagateNotificationVersionStatusRecord {
  status: string;
  outcomeStatus: string;
}

/** Where propagateNotificationVersionStatus hands each record. */
interface PropagateNotificationVersionStatusSink {
  push(record: PropagateNotificationVersionStatusRecord): Promise<void>;
}

/** Sends records to acme.customers.v1.PreferenceValidationService. */
class PropagateNotificationVersionStatusPreferenceValidation implements PropagateNotificationVersionStatusSink {
  private readonly client: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceValidationServiceApi.PreferenceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateNotificationVersionStatusRecord): Promise<void> {
    await retry(() => call<customersPreferenceValidationServiceApi.ValidatePreferenceRequest, customersPreferenceValidationServiceApi.ValidatePreferenceResponse>(
      (request, done) => this.client.validatePreference(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      customersPreferenceValidationServiceApi.ValidatePreferenceRequest.fromPartial({ preferenceId: record.outcomeStatus })));
  }
}

/** Sends records to acme.routing.v1.RouteQueryService. */
class PropagateNotificationVersionStatusRouteQuery implements PropagateNotificationVersionStatusSink {
  private readonly client: routingRouteQueryServiceApi.RouteQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new routingRouteQueryServiceApi.RouteQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateNotificationVersionStatusRecord): Promise<void> {
    await call<routingRouteQueryServiceApi.FindRoutesRequest, routingRouteQueryServiceApi.FindRoutesResponse>(
      (request, done) => this.client.findRoutes(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      routingRouteQueryServiceApi.FindRoutesRequest.fromPartial({ orderBy: record.outcomeStatus, filter: { query: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateNotificationVersionStatusLogOnly implements PropagateNotificationVersionStatusSink {
  async push(record: PropagateNotificationVersionStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchPropagateNotificationVersionStatus(kind: string, record: PropagateNotificationVersionStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: PropagateNotificationVersionStatusRecord): Promise<void> => new PropagateNotificationVersionStatusLogOnly().push(item);
  switch (kind) {
    case "preference-validation":
      write = (item) => new PropagateNotificationVersionStatusPreferenceValidation(runtime).push(item);
      break;
    case "route-query":
      write = (item) => new PropagateNotificationVersionStatusRouteQuery(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.notifications.v1.NotificationHistoryService/AnnotateNotificationVersion and hands what it keeps
 * to the sink of its kind.
 */
export async function propagateNotificationVersionStatus(runtime: Runtime): Promise<void> {
  const origin = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(
    (request, done) => origin.annotateNotificationVersion(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({ reason: "primary-propagate-notification-version-status" }));
  const kept: PropagateNotificationVersionStatusRecord = {
    status: response.result?.status ?? "",
    outcomeStatus: response.outcome?.status ?? "",
  };
  await dispatchPropagateNotificationVersionStatus("route-query", kept, runtime);
}
