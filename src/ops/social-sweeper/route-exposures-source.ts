import * as experimentsExposureValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as metricsMetricSeriesServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeExposuresSource keeps of each LintExposures response. */
interface RouteExposuresSourceRecord {
  source: string;
  message: string;
  status: string;
  referenceId: string;
}

/** Where routeExposuresSource hands each record. */
interface RouteExposuresSourceWriter {
  forward(record: RouteExposuresSourceRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ConversationQueryService. */
class RouteExposuresSourceConversationQuery implements RouteExposuresSourceWriter {
  private readonly client: messagingConversationQueryServiceApi.ConversationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteExposuresSourceRecord): Promise<void> {
    await retry(() => call<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse>(
      (request, done) => this.client.suggestConversations(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingConversationQueryServiceApi.SuggestConversationsRequest.fromPartial({ filter: { region: record.referenceId }, orderBy: record.message, page: { pageToken: record.status } })));
  }
}

/** Writes records to acme.metrics.v1.MetricSeriesService. */
class RouteExposuresSourceMetricSeries implements RouteExposuresSourceWriter {
  private readonly client: metricsMetricSeriesServiceApi.MetricSeriesServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesServiceApi.MetricSeriesServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteExposuresSourceRecord): Promise<void> {
    await call<metricsMetricSeriesServiceApi.CreateMetricSeriesRequest, metricsMetricSeriesServiceApi.CreateMetricSeriesResponse>(
      (request, done) => this.client.createMetricSeries(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      metricsMetricSeriesServiceApi.CreateMetricSeriesRequest.fromPartial({ metricSeries: { metricSeriesId: record.status, name: record.referenceId, code: record.source } }));
  }
}

/**
 * Reads acme.experiments.v1.ExposureValidationService/LintExposures and hands what it keeps to the sink of
 * its kind.
 */
export async function routeExposuresSource(runtime: Runtime): Promise<void> {
  const source = new experimentsExposureValidationServiceApi.ExposureValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>(
    (request, done) => source.lintExposures(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    experimentsExposureValidationServiceApi.LintExposuresRequest.fromPartial({ reason: "current-route-exposures-source" })));
  const entry: RouteExposuresSourceRecord = {
    source: reply.exposure?.source ?? "",
    message: reply.outcome?.message ?? "",
    status: text.normalize(reply.outcome?.status ?? ""),
    referenceId: reply.outcome?.referenceId ?? "",
  };
  const sinks: RouteExposuresSourceWriter[] = [
    new RouteExposuresSourceConversationQuery(runtime),
    new RouteExposuresSourceMetricSeries(runtime),
  ];
  await sinks[1]!.forward(entry);
}
