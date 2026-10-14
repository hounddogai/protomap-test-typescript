import * as cartCartCalculationServiceApi from "../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as pipelinesPipelineServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryPipelinesId keeps of each ListPipelines response. */
interface CarryPipelinesIdRecord {
  correlationId: string;
  nextPageToken: string;
  message: string;
}

/** Where carryPipelinesId hands each record. */
interface CarryPipelinesIdDestination {
  write(record: CarryPipelinesIdRecord): Promise<void>;
}

/** Hands records to acme.media.v1.MediaAssetValidationService. */
class CarryPipelinesIdMediaAssetValidation implements CarryPipelinesIdDestination {
  private readonly client: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryPipelinesIdRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetValidationServiceApi.ScoreMediaAssetRequest, mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse>(
      (request, done) => this.client.scoreMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetRequest.fromPartial({ reason: record.message, mediaAssetId: record.nextPageToken, mediaAsset: { code: record.correlationId } })));
  }
}

/** Sends records to acme.cart.v1.CartCalculationService. */
class CarryPipelinesIdCartCalculation implements CarryPipelinesIdDestination {
  private readonly client: cartCartCalculationServiceApi.CartCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new cartCartCalculationServiceApi.CartCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryPipelinesIdRecord): Promise<void> {
    await call<cartCartCalculationServiceApi.EstimateCartRequest, cartCartCalculationServiceApi.EstimateCartResponse>(
      (request, done) => this.client.estimateCart(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      cartCartCalculationServiceApi.EstimateCartRequest.fromPartial({ cart: { notes: record.message }, cartId: record.correlationId, details: { currencyCode: record.nextPageToken } }));
  }
}

/** Sends records to acme.webbff.v1.PageCompositionQueryService. */
class CarryPipelinesIdPageCompositionQuery implements CarryPipelinesIdDestination {
  private readonly client: webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryPipelinesIdRecord): Promise<void> {
    await call<webbffPageCompositionQueryServiceApi.SuggestPageCompositionsRequest, webbffPageCompositionQueryServiceApi.SuggestPageCompositionsResponse>(
      (request, done) => this.client.suggestPageCompositions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webbffPageCompositionQueryServiceApi.SuggestPageCompositionsRequest.fromPartial({ page: { pageToken: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryPipelinesIdLogOnly implements CarryPipelinesIdDestination {
  async write(record: CarryPipelinesIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCarryPipelinesId(kind: string, record: CarryPipelinesIdRecord, runtime: Runtime): Promise<void> {
  let sink: CarryPipelinesIdDestination = new CarryPipelinesIdLogOnly();
  switch (kind) {
    case "media-asset-validation":
      sink = new CarryPipelinesIdMediaAssetValidation(runtime);
      break;
    case "cart-calculation":
      sink = new CarryPipelinesIdCartCalculation(runtime);
      break;
    case "page-composition-query":
      sink = new CarryPipelinesIdPageCompositionQuery(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.pipelines.v1.PipelineService/ListPipelines and hands what it keeps to the sink of its kind. */
export async function carryPipelinesId(runtime: Runtime): Promise<void> {
  const reader = new pipelinesPipelineServiceApi.PipelineServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<pipelinesPipelineServiceApi.ListPipelinesRequest, pipelinesPipelineServiceApi.ListPipelinesResponse>(
    (request, done) => reader.listPipelines(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    pipelinesPipelineServiceApi.ListPipelinesRequest.fromPartial({ orderBy: "current-carry-pipelines-id" }));
  const entry: CarryPipelinesIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    message: reply.result?.message ?? "",
  };
  await deliverCarryPipelinesId("page-composition-query", entry, runtime);
}
