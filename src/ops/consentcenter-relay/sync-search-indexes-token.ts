import * as driverappDriverHomeQueryServiceApi from "../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncSearchIndexesToken keeps of each SuggestSearchIndexes response. */
interface SyncSearchIndexesTokenRecord {
  nextPageToken: string;
  message: string;
  status: string;
  correlationId: string;
}

/**
 * Reads acme.search.v1.SearchIndexQueryService/SuggestSearchIndexes, keeps its fields by name, and passes
 * some of them to acme.driverapp.v1.DriverHomeQueryService.
 */
export async function syncSearchIndexesToken(runtime: Runtime): Promise<void> {
  const source = new searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>(
    (request, done) => source.suggestSearchIndexes(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest.fromPartial({ orderBy: "current-sync-search-indexes-token" }));
  const entry: SyncSearchIndexesTokenRecord = {
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    message: text.normalize(response.result?.message ?? ""),
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("next-page-token", entry.nextPageToken);
  fields.set("message", entry.message);
  fields.set("status", entry.status);
  fields.set("correlation-id", entry.correlationId);
  const writer = new driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<driverappDriverHomeQueryServiceApi.CountDriverHomesRequest, driverappDriverHomeQueryServiceApi.CountDriverHomesResponse>(
    (request, done) => writer.countDriverHomes(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    driverappDriverHomeQueryServiceApi.CountDriverHomesRequest.fromPartial({ filter: { ownerId: fields.get("correlation-id") ?? "" } }));
}
