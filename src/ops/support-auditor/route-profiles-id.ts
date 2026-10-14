import * as personalizationProfileQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as yardsYardQueryServiceApi from "../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeProfilesId keeps of each FindProfiles response. */
interface RouteProfilesIdRecord {
  correlationId: string;
  message: string;
}

/** Where routeProfilesId hands each record. */
interface RouteProfilesIdWriter {
  deliver(record: RouteProfilesIdRecord): Promise<void>;
}

/** Writes records to acme.yards.v1.YardQueryService. */
class RouteProfilesIdYardQuery implements RouteProfilesIdWriter {
  private readonly client: yardsYardQueryServiceApi.YardQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new yardsYardQueryServiceApi.YardQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteProfilesIdRecord): Promise<void> {
    await call<yardsYardQueryServiceApi.SummarizeYardsRequest, yardsYardQueryServiceApi.SummarizeYardsResponse>(
      (request, done) => this.client.summarizeYards(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      yardsYardQueryServiceApi.SummarizeYardsRequest.fromPartial({ reason: record.message, details: { format: record.correlationId } }));
  }
}

/** Sends records to acme.personalization.v1.RecommendationReportingService. */
class RouteProfilesIdRecommendationReporting implements RouteProfilesIdWriter {
  private readonly client: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteProfilesIdRecord): Promise<void> {
    await call<personalizationRecommendationReportingServiceApi.FetchRecommendationReportRequest, personalizationRecommendationReportingServiceApi.FetchRecommendationReportResponse>(
      (request, done) => this.client.fetchRecommendationReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationReportingServiceApi.FetchRecommendationReportRequest.fromPartial({ recommendationId: record.message }));
  }
}

/** Runs the action registered for kind. */
async function actOnRouteProfilesId(kind: string, record: RouteProfilesIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "yard-query": () => new RouteProfilesIdYardQuery(runtime).deliver(record),
    "recommendation-reporting": () => new RouteProfilesIdRecommendationReporting(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.personalization.v1.ProfileQueryService/FindProfiles and hands what it keeps to the sink of its
 * kind.
 */
export async function routeProfilesId(runtime: Runtime): Promise<void> {
  const reader = new personalizationProfileQueryServiceApi.ProfileQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<personalizationProfileQueryServiceApi.FindProfilesRequest, personalizationProfileQueryServiceApi.FindProfilesResponse>(
    (request, done) => reader.findProfiles(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationProfileQueryServiceApi.FindProfilesRequest.fromPartial({ orderBy: "main-route-profiles-id" }));
  const record: RouteProfilesIdRecord = {
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
    message: text.normalize(reply.result?.message ?? ""),
  };
  await actOnRouteProfilesId("recommendation-reporting", record, runtime);
}
