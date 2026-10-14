import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as contentArticleQueryServiceApi from "../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as datasetsDatasetServiceApi from "../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeForumName keeps of each ApproveForum response. */
interface RouteForumNameRecord {
  name: string;
  message: string;
}

/** Where routeForumName hands each record. */
interface RouteForumNameWriter {
  write(record: RouteForumNameRecord): Promise<void>;
}

/** Sends records to acme.datasets.v1.DatasetService. */
class RouteForumNameDataset implements RouteForumNameWriter {
  private readonly client: datasetsDatasetServiceApi.DatasetServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new datasetsDatasetServiceApi.DatasetServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RouteForumNameRecord): Promise<void> {
    await retry(() => call<datasetsDatasetServiceApi.SearchDatasetsRequest, datasetsDatasetServiceApi.SearchDatasetsResponse>(
      (request, done) => this.client.searchDatasets(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      datasetsDatasetServiceApi.SearchDatasetsRequest.fromPartial({ orderBy: record.name })));
  }
}

/** Sends records to acme.content.v1.ArticleQueryService. */
class RouteForumNameArticleQuery implements RouteForumNameWriter {
  private readonly client: contentArticleQueryServiceApi.ArticleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleQueryServiceApi.ArticleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RouteForumNameRecord): Promise<void> {
    await call<contentArticleQueryServiceApi.CountArticlesRequest, contentArticleQueryServiceApi.CountArticlesResponse>(
      (request, done) => this.client.countArticles(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentArticleQueryServiceApi.CountArticlesRequest.fromPartial({ orderBy: record.name, filter: { ownerId: record.message } }));
  }
}

/** Reads acme.community.v1.ForumApprovalService/ApproveForum and hands what it keeps to the sink of its kind. */
export async function routeForumName(runtime: Runtime): Promise<void> {
  const reader = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse>(
    (request, done) => reader.approveForum(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityForumApprovalServiceApi.ApproveForumRequest.fromPartial({ reason: "live-route-forum-name" }));
  const row: RouteForumNameRecord = {
    name: response.forum?.name ?? "",
    message: response.result?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: RouteForumNameWriter }> = [
    { kind: "dataset", sink: new RouteForumNameDataset(runtime) },
    { kind: "article-query", sink: new RouteForumNameArticleQuery(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "dataset") continue;
    await entry.sink.write(row);
  }
}
