import * as analyticsAnalyticsEventQueryServiceApi from "../../../.cache/proto/acme/analytics/v1/analytics_event_query_service.js";
import * as ticketingTicketQueryServiceApi from "../../../.cache/proto/acme/ticketing/v1/ticket_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayTicketsMessage keeps of each CountTickets response. */
interface RelayTicketsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where relayTicketsMessage hands each record. */
interface RelayTicketsMessageDestination {
  push(record: RelayTicketsMessageRecord): Promise<void>;
}

/** Hands records to acme.analytics.v1.AnalyticsEventQueryService. */
class RelayTicketsMessageAnalyticsEventQuery implements RelayTicketsMessageDestination {
  private readonly client: analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayTicketsMessageRecord): Promise<void> {
    await call<analyticsAnalyticsEventQueryServiceApi.PeekAnalyticsEventRequest, analyticsAnalyticsEventQueryServiceApi.PeekAnalyticsEventResponse>(
      (request, done) => this.client.peekAnalyticsEvent(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      analyticsAnalyticsEventQueryServiceApi.PeekAnalyticsEventRequest.fromPartial({ analyticsEventId: record.correlationId }));
  }
}

/**
 * Reads acme.ticketing.v1.TicketQueryService/CountTickets and hands what it keeps to
 * acme.analytics.v1.AnalyticsEventQueryService.
 */
export async function relayTicketsMessage(runtime: Runtime): Promise<void> {
  const reader = new ticketingTicketQueryServiceApi.TicketQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<ticketingTicketQueryServiceApi.CountTicketsRequest, ticketingTicketQueryServiceApi.CountTicketsResponse>(
    (request, done) => reader.countTickets(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    ticketingTicketQueryServiceApi.CountTicketsRequest.fromPartial({ orderBy: "primary-relay-tickets-message" })));
  const kept: RelayTicketsMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  await new RelayTicketsMessageAnalyticsEventQuery(runtime).push(kept);
}
