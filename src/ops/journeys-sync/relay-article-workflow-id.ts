import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import * as workplacesBuildingServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayArticleWorkflowId keeps of each RetryArticleWorkflow response. */
interface RelayArticleWorkflowIdRecord {
  referenceId: string;
  articleId: string;
  status: string;
}

/** Where relayArticleWorkflowId hands each record. */
interface RelayArticleWorkflowIdDestination {
  deliver(record: RelayArticleWorkflowIdRecord): Promise<void>;
}

/** Writes records to acme.workplaces.v1.BuildingService. */
class RelayArticleWorkflowIdBuilding implements RelayArticleWorkflowIdDestination {
  private readonly client: workplacesBuildingServiceApi.BuildingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new workplacesBuildingServiceApi.BuildingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayArticleWorkflowIdRecord): Promise<void> {
    await call<workplacesBuildingServiceApi.CloneBuildingRequest, workplacesBuildingServiceApi.CloneBuildingResponse>(
      (request, done) => this.client.cloneBuilding(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      workplacesBuildingServiceApi.CloneBuildingRequest.fromPartial({ requestId: record.articleId, building: { name: record.status, buildingId: record.referenceId } }));
  }
}

/** Passes records to acme.media.v1.RenditionWorkflowService. */
class RelayArticleWorkflowIdRenditionWorkflow implements RelayArticleWorkflowIdDestination {
  private readonly client: mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayArticleWorkflowIdRecord): Promise<void> {
    await call<mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse>(
      (request, done) => this.client.retryRenditionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest.fromPartial({ rendition: { renditionId: record.referenceId } }));
  }
}

/** Passes records to acme.fuel.v1.FuelCardQueryService. */
class RelayArticleWorkflowIdFuelCardQuery implements RelayArticleWorkflowIdDestination {
  private readonly client: fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayArticleWorkflowIdRecord): Promise<void> {
    await call<fuelFuelCardQueryServiceApi.FindFuelCardsRequest, fuelFuelCardQueryServiceApi.FindFuelCardsResponse>(
      (request, done) => this.client.findFuelCards(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fuelFuelCardQueryServiceApi.FindFuelCardsRequest.fromPartial({ filter: { region: record.articleId } }));
  }
}

/**
 * Reads acme.content.v1.ArticleWorkflowService/RetryArticleWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function relayArticleWorkflowId(runtime: Runtime): Promise<void> {
  const upstream = new contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest, contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse>(
    (request, done) => upstream.retryArticleWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest.fromPartial({ reason: "nightly-relay-article-workflow-id" }));
  const row: RelayArticleWorkflowIdRecord = {
    referenceId: text.normalize(reply.outcome?.referenceId ?? ""),
    articleId: reply.article?.articleId ?? "",
    status: reply.outcome?.status ?? "",
  };
  const sinks: RelayArticleWorkflowIdDestination[] = [
    new RelayArticleWorkflowIdBuilding(runtime),
    new RelayArticleWorkflowIdRenditionWorkflow(runtime),
    new RelayArticleWorkflowIdFuelCardQuery(runtime),
  ];
  await sinks[0]!.deliver(row);
}
