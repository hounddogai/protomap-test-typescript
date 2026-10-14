import * as anomaliesAnomalyQueryServiceApi from "../../../.cache/proto/acme/anomalies/v1/anomaly_query_service.js";
import * as communityModerationLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as messagingChannelCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeModerationLifecycleStatus keeps of each GetModerationLifecycle response. */
interface RouteModerationLifecycleStatusRecord {
  status: string;
  moderationId: string;
  message: string;
  correlationId: string;
}

/** Where routeModerationLifecycleStatus hands each record. */
interface RouteModerationLifecycleStatusTarget {
  forward(record: RouteModerationLifecycleStatusRecord): Promise<void>;
}

/** Passes records to acme.anomalies.v1.AnomalyQueryService. */
class RouteModerationLifecycleStatusAnomalyQuery implements RouteModerationLifecycleStatusTarget {
  private readonly client: anomaliesAnomalyQueryServiceApi.AnomalyQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new anomaliesAnomalyQueryServiceApi.AnomalyQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteModerationLifecycleStatusRecord): Promise<void> {
    await call<anomaliesAnomalyQueryServiceApi.BrowseAnomaliesRequest, anomaliesAnomalyQueryServiceApi.BrowseAnomaliesResponse>(
      (request, done) => this.client.browseAnomalies(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      anomaliesAnomalyQueryServiceApi.BrowseAnomaliesRequest.fromPartial({ orderBy: record.correlationId, filter: { ownerId: record.moderationId } }));
  }
}

/** Sends records to acme.messaging.v1.ChannelCalculationService. */
class RouteModerationLifecycleStatusChannelCalculation implements RouteModerationLifecycleStatusTarget {
  private readonly client: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelCalculationServiceApi.ChannelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteModerationLifecycleStatusRecord): Promise<void> {
    await call<messagingChannelCalculationServiceApi.EstimateChannelRequest, messagingChannelCalculationServiceApi.EstimateChannelResponse>(
      (request, done) => this.client.estimateChannel(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChannelCalculationServiceApi.EstimateChannelRequest.fromPartial({ reason: record.correlationId, channel: { channelId: record.status }, details: { currencyCode: record.message } }));
  }
}

/** Passes records to acme.notifications.v1.NotificationQueryService. */
class RouteModerationLifecycleStatusNotificationQuery implements RouteModerationLifecycleStatusTarget {
  private readonly client: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationQueryServiceApi.NotificationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteModerationLifecycleStatusRecord): Promise<void> {
    await retry(() => call<notificationsNotificationQueryServiceApi.FindNotificationsRequest, notificationsNotificationQueryServiceApi.FindNotificationsResponse>(
      (request, done) => this.client.findNotifications(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationQueryServiceApi.FindNotificationsRequest.fromPartial({ filter: { region: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class RouteModerationLifecycleStatusLogOnly implements RouteModerationLifecycleStatusTarget {
  async forward(record: RouteModerationLifecycleStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRouteModerationLifecycleStatus(kind: string, record: RouteModerationLifecycleStatusRecord, runtime: Runtime): Promise<void> {
  let sink: RouteModerationLifecycleStatusTarget = new RouteModerationLifecycleStatusLogOnly();
  switch (kind) {
    case "anomaly-query":
      sink = new RouteModerationLifecycleStatusAnomalyQuery(runtime);
      break;
    case "channel-calculation":
      sink = new RouteModerationLifecycleStatusChannelCalculation(runtime);
      break;
    case "notification-query":
      sink = new RouteModerationLifecycleStatusNotificationQuery(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.community.v1.ModerationLifecycleService/GetModerationLifecycle and hands what it keeps to the
 * sink of its kind.
 */
export async function routeModerationLifecycleStatus(runtime: Runtime): Promise<void> {
  const source = new communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<communityModerationLifecycleServiceApi.GetModerationLifecycleRequest, communityModerationLifecycleServiceApi.GetModerationLifecycleResponse>(
    (request, done) => source.getModerationLifecycle(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityModerationLifecycleServiceApi.GetModerationLifecycleRequest.fromPartial({ moderationId: "live-route-moderation-lifecycle-status" }));
  const entry: RouteModerationLifecycleStatusRecord = {
    status: current.result?.status ?? "",
    moderationId: current.moderation?.moderationId ?? "",
    message: text.normalize(current.result?.message ?? ""),
    correlationId: text.normalize(current.result?.correlationId ?? ""),
  };
  await deliverRouteModerationLifecycleStatus("anomaly-query", entry, runtime);
}
