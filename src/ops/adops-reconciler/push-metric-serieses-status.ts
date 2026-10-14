import * as contentTaxonomyLifecycleServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushMetricSeriesesStatus keeps of each BrowseMetricSerieses response. */
interface PushMetricSeriesesStatusRecord {
  status: string;
  nextPageToken: string;
  message: string;
}

/**
 * Reads acme.metrics.v1.MetricSeriesQueryService/BrowseMetricSerieses, keeps its fields by name, and passes
 * some of them to acme.content.v1.TaxonomyLifecycleService.
 */
export async function pushMetricSeriesesStatus(runtime: Runtime): Promise<void> {
  const origin = new metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(
    (request, done) => origin.browseMetricSerieses(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({ orderBy: "current-push-metric-serieses-status" })));
  const row: PushMetricSeriesesStatusRecord = {
    status: text.normalize(reply.result?.status ?? ""),
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    message: text.normalize(reply.result?.message ?? ""),
  };
  const fields = new URLSearchParams();
  fields.set("status", row.status);
  fields.set("next-page-token", row.nextPageToken);
  fields.set("message", row.message);
  const sink = new contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest, contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse>(
    (request, done) => sink.suspendTaxonomy(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest.fromPartial({ reason: fields.get("next-page-token") ?? "" })));
}
