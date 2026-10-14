import * as broadcastsBroadcastServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as messagingChannelReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as routingRouteCalculationServiceApi from "../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillBroadcastMessage keeps of each UpdateBroadcast response. */
interface BackfillBroadcastMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where backfillBroadcastMessage hands each record. */
interface BackfillBroadcastMessageWriter {
  deliver(record: BackfillBroadcastMessageRecord): Promise<void>;
}

/** Writes records to acme.routing.v1.RouteCalculationService. */
class BackfillBroadcastMessageRouteCalculation implements BackfillBroadcastMessageWriter {
  private readonly client: routingRouteCalculationServiceApi.RouteCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new routingRouteCalculationServiceApi.RouteCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillBroadcastMessageRecord): Promise<void> {
    await call<routingRouteCalculationServiceApi.EstimateRouteRequest, routingRouteCalculationServiceApi.EstimateRouteResponse>(
      (request, done) => this.client.estimateRoute(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      routingRouteCalculationServiceApi.EstimateRouteRequest.fromPartial({ route: { notes: record.correlationId } }));
  }
}

/** Sends records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class BackfillBroadcastMessageWebhookDeliveryQuery implements BackfillBroadcastMessageWriter {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillBroadcastMessageRecord): Promise<void> {
    await call<webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesResponse>(
      (request, done) => this.client.findWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest.fromPartial({ filter: { region: record.message, query: record.status } }));
  }
}

/** Writes records to acme.messaging.v1.ChannelReportingService. */
class BackfillBroadcastMessageChannelReporting implements BackfillBroadcastMessageWriter {
  private readonly client: messagingChannelReportingServiceApi.ChannelReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelReportingServiceApi.ChannelReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillBroadcastMessageRecord): Promise<void> {
    await call<messagingChannelReportingServiceApi.FetchChannelReportRequest, messagingChannelReportingServiceApi.FetchChannelReportResponse>(
      (request, done) => this.client.fetchChannelReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChannelReportingServiceApi.FetchChannelReportRequest.fromPartial({ channelId: record.status }));
  }
}

/** Reads acme.broadcasts.v1.BroadcastService/UpdateBroadcast and hands what it keeps to the sink of its kind. */
export async function backfillBroadcastMessage(runtime: Runtime): Promise<void> {
  const origin = new broadcastsBroadcastServiceApi.BroadcastServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<broadcastsBroadcastServiceApi.UpdateBroadcastRequest, broadcastsBroadcastServiceApi.UpdateBroadcastResponse>(
    (request, done) => origin.updateBroadcast(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    broadcastsBroadcastServiceApi.UpdateBroadcastRequest.fromPartial({}));
  const entry: BackfillBroadcastMessageRecord = {
    message: reply.result?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
    status: reply.result?.status ?? "",
  };
  const entries: Array<{ kind: string; sink: BackfillBroadcastMessageWriter }> = [
    { kind: "route-calculation", sink: new BackfillBroadcastMessageRouteCalculation(runtime) },
    { kind: "webhook-delivery-query", sink: new BackfillBroadcastMessageWebhookDeliveryQuery(runtime) },
    { kind: "channel-reporting", sink: new BackfillBroadcastMessageChannelReporting(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "channel-reporting") continue;
    await entry.sink.deliver(entry);
  }
}
