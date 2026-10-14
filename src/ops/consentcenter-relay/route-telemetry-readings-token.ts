import * as experimentsVariantWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as promotionsPromotionServiceApi from "../../../.cache/proto/acme/promotions/v1/promotion_service.js";
import * as surveysQuestionValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeTelemetryReadingsToken keeps of each FindTelemetryReadings response. */
interface RouteTelemetryReadingsTokenRecord {
  nextPageToken: string;
  status: string;
  message: string;
}

/** Where routeTelemetryReadingsToken hands each record. */
interface RouteTelemetryReadingsTokenWriter {
  deliver(record: RouteTelemetryReadingsTokenRecord): Promise<void>;
}

/** Hands records to acme.surveys.v1.QuestionValidationService. */
class RouteTelemetryReadingsTokenQuestionValidation implements RouteTelemetryReadingsTokenWriter {
  private readonly client: surveysQuestionValidationServiceApi.QuestionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionValidationServiceApi.QuestionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteTelemetryReadingsTokenRecord): Promise<void> {
    await retry(() => call<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse>(
      (request, done) => this.client.validateQuestion(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysQuestionValidationServiceApi.ValidateQuestionRequest.fromPartial({ question: { name: record.message } })));
  }
}

/** Sends records to acme.pipelines.v1.PipelineCalculationService. */
class RouteTelemetryReadingsTokenPipelineCalculation implements RouteTelemetryReadingsTokenWriter {
  private readonly client: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteTelemetryReadingsTokenRecord): Promise<void> {
    await retry(() => call<pipelinesPipelineCalculationServiceApi.GetPipelineRatesRequest, pipelinesPipelineCalculationServiceApi.GetPipelineRatesResponse>(
      (request, done) => this.client.getPipelineRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      pipelinesPipelineCalculationServiceApi.GetPipelineRatesRequest.fromPartial({ pipelineId: record.status })));
  }
}

/** Sends records to acme.experiments.v1.VariantWorkflowService. */
class RouteTelemetryReadingsTokenVariantWorkflow implements RouteTelemetryReadingsTokenWriter {
  private readonly client: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteTelemetryReadingsTokenRecord): Promise<void> {
    await call<experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse>(
      (request, done) => this.client.retryVariantWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest.fromPartial({ variant: { variantId: record.message, name: record.status }, variantId: record.nextPageToken }));
  }
}

/** Writes records to acme.promotions.v1.PromotionService. */
class RouteTelemetryReadingsTokenPromotion implements RouteTelemetryReadingsTokenWriter {
  private readonly client: promotionsPromotionServiceApi.PromotionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new promotionsPromotionServiceApi.PromotionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteTelemetryReadingsTokenRecord): Promise<void> {
    await call<promotionsPromotionServiceApi.DeletePromotionRequest, promotionsPromotionServiceApi.DeletePromotionResponse>(
      (request, done) => this.client.deletePromotion(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      promotionsPromotionServiceApi.DeletePromotionRequest.fromPartial({ etag: record.nextPageToken, promotionId: record.status, reason: record.message }));
  }
}

/**
 * Reads acme.telematics.v1.TelemetryReadingQueryService/FindTelemetryReadings and hands what it keeps to the
 * sink of its kind.
 */
export async function routeTelemetryReadingsToken(runtime: Runtime): Promise<void> {
  const upstream = new telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<telematicsTelemetryReadingQueryServiceApi.FindTelemetryReadingsRequest, telematicsTelemetryReadingQueryServiceApi.FindTelemetryReadingsResponse>(
    (request, done) => upstream.findTelemetryReadings(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    telematicsTelemetryReadingQueryServiceApi.FindTelemetryReadingsRequest.fromPartial({ orderBy: "nightly-route-telemetry-readings-token" }));
  const entry: RouteTelemetryReadingsTokenRecord = {
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: RouteTelemetryReadingsTokenWriter }> = [
    { kind: "question-validation", sink: new RouteTelemetryReadingsTokenQuestionValidation(runtime) },
    { kind: "pipeline-calculation", sink: new RouteTelemetryReadingsTokenPipelineCalculation(runtime) },
    { kind: "variant-workflow", sink: new RouteTelemetryReadingsTokenVariantWorkflow(runtime) },
    { kind: "promotion", sink: new RouteTelemetryReadingsTokenPromotion(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "promotion") continue;
    await entry.sink.deliver(entry);
  }
}
