import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as mediaRenditionLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as sponsorshipsSponsorQueryServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateRenditionStatus keeps of each ActivateRendition response. */
interface PropagateRenditionStatusRecord {
  status: string;
  message: string;
}

/** Where propagateRenditionStatus hands each record. */
interface PropagateRenditionStatusDestination {
  send(record: PropagateRenditionStatusRecord): Promise<void>;
}

/** Writes records to acme.sponsorships.v1.SponsorQueryService. */
class PropagateRenditionStatusSponsorQuery implements PropagateRenditionStatusDestination {
  private readonly client: sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PropagateRenditionStatusRecord): Promise<void> {
    await call<sponsorshipsSponsorQueryServiceApi.BrowseSponsorsRequest, sponsorshipsSponsorQueryServiceApi.BrowseSponsorsResponse>(
      (request, done) => this.client.browseSponsors(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      sponsorshipsSponsorQueryServiceApi.BrowseSponsorsRequest.fromPartial({ filter: { ownerId: record.message }, orderBy: record.status }));
  }
}

/** Sends records to acme.search.v1.SearchIndexQueryService. */
class PropagateRenditionStatusSearchIndexQuery implements PropagateRenditionStatusDestination {
  private readonly client: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PropagateRenditionStatusRecord): Promise<void> {
    await call<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse>(
      (request, done) => this.client.browseSearchIndexes(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest.fromPartial({ filter: { region: record.status }, page: { pageToken: record.message } }));
  }
}

/** Sends records to acme.dispatch.v1.DispatchOrderQueryService. */
class PropagateRenditionStatusDispatchOrderQuery implements PropagateRenditionStatusDestination {
  private readonly client: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PropagateRenditionStatusRecord): Promise<void> {
    await retry(() => call<dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersResponse>(
      (request, done) => this.client.summarizeDispatchOrders(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersRequest.fromPartial({ reason: record.message })));
  }
}

/**
 * Reads acme.media.v1.RenditionLifecycleService/ActivateRendition and hands what it keeps to the sink of its
 * kind.
 */
export async function propagateRenditionStatus(runtime: Runtime): Promise<void> {
  const source = new mediaRenditionLifecycleServiceApi.RenditionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<mediaRenditionLifecycleServiceApi.ActivateRenditionRequest, mediaRenditionLifecycleServiceApi.ActivateRenditionResponse>(
    (request, done) => source.activateRendition(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaRenditionLifecycleServiceApi.ActivateRenditionRequest.fromPartial({ renditionId: "primary-propagate-rendition-status" }));
  const record: PropagateRenditionStatusRecord = {
    status: found.outcome?.status ?? "",
    message: found.outcome?.message ?? "",
  };
  const sinks = new Map<string, PropagateRenditionStatusDestination>([
    ["sponsor-query", new PropagateRenditionStatusSponsorQuery(runtime)],
    ["search-index-query", new PropagateRenditionStatusSearchIndexQuery(runtime)],
    ["dispatch-order-query", new PropagateRenditionStatusDispatchOrderQuery(runtime)],
  ]);
  const sink = sinks.get(process.env["PROPAGATE_RENDITION_STATUS_TARGET"] ?? "");
  if (!sink) return;
  await sink.send(record);
}
