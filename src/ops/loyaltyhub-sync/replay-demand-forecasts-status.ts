import * as audiencesAudienceQueryServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as forecastingDemandForecastQueryServiceApi from "../../../.cache/proto/acme/forecasting/v1/demand_forecast_query_service.js";
import * as showsShowQueryServiceApi from "../../../.cache/proto/acme/shows/v1/show_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayDemandForecastsStatus keeps of each BrowseDemandForecasts response. */
interface ReplayDemandForecastsStatusRecord {
  status: string;
  nextPageToken: string;
  correlationId: string;
}

/** Where replayDemandForecastsStatus hands each record. */
interface ReplayDemandForecastsStatusSink {
  write(record: ReplayDemandForecastsStatusRecord): Promise<void>;
}

/** Writes records to acme.audiences.v1.AudienceQueryService. */
class ReplayDemandForecastsStatusAudienceQuery implements ReplayDemandForecastsStatusSink {
  private readonly client: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceQueryServiceApi.AudienceQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayDemandForecastsStatusRecord): Promise<void> {
    await call<audiencesAudienceQueryServiceApi.SuggestAudiencesRequest, audiencesAudienceQueryServiceApi.SuggestAudiencesResponse>(
      (request, done) => this.client.suggestAudiences(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceQueryServiceApi.SuggestAudiencesRequest.fromPartial({ filter: { ownerId: record.nextPageToken } }));
  }
}

/** Sends records to acme.shows.v1.ShowQueryService. */
class ReplayDemandForecastsStatusShowQuery implements ReplayDemandForecastsStatusSink {
  private readonly client: showsShowQueryServiceApi.ShowQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new showsShowQueryServiceApi.ShowQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayDemandForecastsStatusRecord): Promise<void> {
    await call<showsShowQueryServiceApi.BrowseShowsRequest, showsShowQueryServiceApi.BrowseShowsResponse>(
      (request, done) => this.client.browseShows(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      showsShowQueryServiceApi.BrowseShowsRequest.fromPartial({ filter: { query: record.status }, orderBy: record.nextPageToken }));
  }
}

/** Runs the action registered for kind. */
async function actOnReplayDemandForecastsStatus(kind: string, record: ReplayDemandForecastsStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "audience-query": () => new ReplayDemandForecastsStatusAudienceQuery(runtime).write(record),
    "show-query": () => new ReplayDemandForecastsStatusShowQuery(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.forecasting.v1.DemandForecastQueryService/BrowseDemandForecasts and hands what it keeps to the
 * sink of its kind.
 */
export async function replayDemandForecastsStatus(runtime: Runtime): Promise<void> {
  const reader = new forecastingDemandForecastQueryServiceApi.DemandForecastQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<forecastingDemandForecastQueryServiceApi.BrowseDemandForecastsRequest, forecastingDemandForecastQueryServiceApi.BrowseDemandForecastsResponse>(
    (request, done) => reader.browseDemandForecasts(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    forecastingDemandForecastQueryServiceApi.BrowseDemandForecastsRequest.fromPartial({ orderBy: "nightly-replay-demand-forecasts-status" }));
  const entry: ReplayDemandForecastsStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await actOnReplayDemandForecastsStatus("show-query", entry, runtime);
}
