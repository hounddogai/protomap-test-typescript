import * as pipelinesPipelineQueryServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as warehousingWarehouseServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportGetWarehousesStatus keeps of each BatchGetWarehouses response. */
interface ExportGetWarehousesStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
}

/** Where exportGetWarehousesStatus hands each record. */
interface ExportGetWarehousesStatusDestination {
  forward(record: ExportGetWarehousesStatusRecord): Promise<void>;
}

/** Hands records to acme.surveys.v1.SurveyResponseValidationService. */
class ExportGetWarehousesStatusSurveyResponseValidation implements ExportGetWarehousesStatusDestination {
  private readonly client: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportGetWarehousesStatusRecord): Promise<void> {
    await call<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>(
      (request, done) => this.client.normalizeSurveyResponse(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.fromPartial({ surveyResponse: { source: record.correlationId } }));
  }
}

/** Passes records to acme.pipelines.v1.PipelineQueryService. */
class ExportGetWarehousesStatusPipelineQuery implements ExportGetWarehousesStatusDestination {
  private readonly client: pipelinesPipelineQueryServiceApi.PipelineQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineQueryServiceApi.PipelineQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportGetWarehousesStatusRecord): Promise<void> {
    await call<pipelinesPipelineQueryServiceApi.SuggestPipelinesRequest, pipelinesPipelineQueryServiceApi.SuggestPipelinesResponse>(
      (request, done) => this.client.suggestPipelines(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      pipelinesPipelineQueryServiceApi.SuggestPipelinesRequest.fromPartial({ filter: { ownerId: record.correlationId, region: record.nextPageToken, query: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportGetWarehousesStatusLogOnly implements ExportGetWarehousesStatusDestination {
  async forward(record: ExportGetWarehousesStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchExportGetWarehousesStatus(kind: string, record: ExportGetWarehousesStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: ExportGetWarehousesStatusRecord): Promise<void> => new ExportGetWarehousesStatusLogOnly().forward(item);
  switch (kind) {
    case "survey-response-validation":
      write = (item) => new ExportGetWarehousesStatusSurveyResponseValidation(runtime).forward(item);
      break;
    case "pipeline-query":
      write = (item) => new ExportGetWarehousesStatusPipelineQuery(runtime).forward(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.warehousing.v1.WarehouseService/BatchGetWarehouses and hands what it keeps to the sink of its
 * kind.
 */
export async function exportGetWarehousesStatus(runtime: Runtime): Promise<void> {
  const reader = new warehousingWarehouseServiceApi.WarehouseServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<warehousingWarehouseServiceApi.BatchGetWarehousesRequest, warehousingWarehouseServiceApi.BatchGetWarehousesResponse>(
    (request, done) => reader.batchGetWarehouses(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    warehousingWarehouseServiceApi.BatchGetWarehousesRequest.fromPartial({}));
  const entry: ExportGetWarehousesStatusRecord = {
    status: found.result?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  await dispatchExportGetWarehousesStatus("pipeline-query", entry, runtime);
}
