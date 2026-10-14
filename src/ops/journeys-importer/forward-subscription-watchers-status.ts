import * as audiencesAudienceQueryServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardSubscriptionWatchersStatus keeps of each NotifySubscriptionWatchers response. */
interface ForwardSubscriptionWatchersStatusRecord {
  status: string;
  name: string;
  outcomeStatus: string;
  correlationId: string;
}

/** Where forwardSubscriptionWatchersStatus hands each record. */
interface ForwardSubscriptionWatchersStatusTarget {
  push(record: ForwardSubscriptionWatchersStatusRecord): Promise<void>;
}

/** Passes records to acme.audiences.v1.AudienceQueryService. */
class ForwardSubscriptionWatchersStatusAudienceQuery implements ForwardSubscriptionWatchersStatusTarget {
  private readonly client: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceQueryServiceApi.AudienceQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardSubscriptionWatchersStatusRecord): Promise<void> {
    await call<audiencesAudienceQueryServiceApi.CountAudiencesRequest, audiencesAudienceQueryServiceApi.CountAudiencesResponse>(
      (request, done) => this.client.countAudiences(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceQueryServiceApi.CountAudiencesRequest.fromPartial({ filter: { query: record.outcomeStatus, ownerId: record.correlationId } }));
  }
}

/** Hands records to acme.seating.v1.SeatMapQueryService. */
class ForwardSubscriptionWatchersStatusSeatMapQuery implements ForwardSubscriptionWatchersStatusTarget {
  private readonly client: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardSubscriptionWatchersStatusRecord): Promise<void> {
    await call<seatingSeatMapQueryServiceApi.CountSeatMapsRequest, seatingSeatMapQueryServiceApi.CountSeatMapsResponse>(
      (request, done) => this.client.countSeatMaps(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      seatingSeatMapQueryServiceApi.CountSeatMapsRequest.fromPartial({ filter: { query: record.outcomeStatus, region: record.name } }));
  }
}

/**
 * Reads acme.notifications.v1.SubscriptionNotificationService/NotifySubscriptionWatchers and hands what it
 * keeps to the sink of its kind.
 */
export async function forwardSubscriptionWatchersStatus(runtime: Runtime): Promise<void> {
  const origin = new notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse>(
    (request, done) => origin.notifySubscriptionWatchers(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest.fromPartial({ reason: "primary-forward-subscription-watchers-status" }));
  const row: ForwardSubscriptionWatchersStatusRecord = {
    status: found.result?.status ?? "",
    name: found.subscription?.name ?? "",
    outcomeStatus: found.outcome?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  const sinks = new Map<string, ForwardSubscriptionWatchersStatusTarget>([
    ["audience-query", new ForwardSubscriptionWatchersStatusAudienceQuery(runtime)],
    ["seat-map-query", new ForwardSubscriptionWatchersStatusSeatMapQuery(runtime)],
  ]);
  const sink = sinks.get(process.env["FORWARD_SUBSCRIPTION_WATCHERS_STATUS_TARGET"] ?? "");
  if (!sink) return;
  await sink.push(row);
}
