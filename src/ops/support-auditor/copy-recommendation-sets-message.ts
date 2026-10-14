import * as lineageLineageNodeServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as recommendationsRecommendationSetQueryServiceApi from "../../../.cache/proto/acme/recommendations/v1/recommendation_set_query_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyRecommendationSetsMessage keeps of each BrowseRecommendationSets response. */
interface CopyRecommendationSetsMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where copyRecommendationSetsMessage hands each record. */
interface CopyRecommendationSetsMessageWriter {
  forward(record: CopyRecommendationSetsMessageRecord): Promise<void>;
}

/** Writes records to acme.lineage.v1.LineageNodeService. */
class CopyRecommendationSetsMessageLineageNode implements CopyRecommendationSetsMessageWriter {
  private readonly client: lineageLineageNodeServiceApi.LineageNodeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeServiceApi.LineageNodeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyRecommendationSetsMessageRecord): Promise<void> {
    await call<lineageLineageNodeServiceApi.UpdateLineageNodeRequest, lineageLineageNodeServiceApi.UpdateLineageNodeResponse>(
      (request, done) => this.client.updateLineageNode(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      lineageLineageNodeServiceApi.UpdateLineageNodeRequest.fromPartial({ lineageNode: { name: record.status, parentId: record.message, lineageNodeId: record.correlationId } }));
  }
}

/** Hands records to acme.sponsorships.v1.SponsorService. */
class CopyRecommendationSetsMessageSponsor implements CopyRecommendationSetsMessageWriter {
  private readonly client: sponsorshipsSponsorServiceApi.SponsorServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorServiceApi.SponsorServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyRecommendationSetsMessageRecord): Promise<void> {
    await call<sponsorshipsSponsorServiceApi.ListSponsorsRequest, sponsorshipsSponsorServiceApi.ListSponsorsResponse>(
      (request, done) => this.client.listSponsors(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      sponsorshipsSponsorServiceApi.ListSponsorsRequest.fromPartial({ orderBy: record.status, page: { pageToken: record.correlationId }, filter: { query: record.message } }));
  }
}

/**
 * Reads acme.recommendations.v1.RecommendationSetQueryService/BrowseRecommendationSets and hands what it
 * keeps to the sink of its kind.
 */
export async function copyRecommendationSetsMessage(runtime: Runtime): Promise<void> {
  const upstream = new recommendationsRecommendationSetQueryServiceApi.RecommendationSetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsRequest, recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsResponse>(
    (request, done) => upstream.browseRecommendationSets(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsRequest.fromPartial({ orderBy: "nightly-copy-recommendation-sets-message" }));
  const row: CopyRecommendationSetsMessageRecord = {
    message: found.result?.message ?? "",
    correlationId: text.normalize(found.result?.correlationId ?? ""),
    status: found.result?.status ?? "",
  };
  const sinks = new Map<string, CopyRecommendationSetsMessageWriter>();
  sinks.set("lineage-node", new CopyRecommendationSetsMessageLineageNode(runtime));
  sinks.set("sponsor", new CopyRecommendationSetsMessageSponsor(runtime));
  await sinks.get("sponsor")!.forward(row);
}
