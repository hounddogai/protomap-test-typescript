import * as labelingLabelingTaskQueryServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as seatingSeatMapCalculationServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_calculation_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncSeatMapId keeps of each QuoteSeatMap response. */
interface SyncSeatMapIdRecord {
  seatMapId: string;
  currencyCode: string;
  message: string;
  name: string;
}

/** Where syncSeatMapId hands each record. */
interface SyncSeatMapIdTarget {
  forward(record: SyncSeatMapIdRecord): Promise<void>;
}

/** Passes records to acme.metrics.v1.MetricSeriesValidationService. */
class SyncSeatMapIdMetricSeriesValidation implements SyncSeatMapIdTarget {
  private readonly client: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncSeatMapIdRecord): Promise<void> {
    await call<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse>(
      (request, done) => this.client.checkMetricSeriesEligibility(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({ details: { locale: record.name }, metricSeries: { name: record.message } }));
  }
}

/** Passes records to acme.surveys.v1.QuestionWorkflowService. */
class SyncSeatMapIdQuestionWorkflow implements SyncSeatMapIdTarget {
  private readonly client: surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncSeatMapIdRecord): Promise<void> {
    await retry(() => call<surveysQuestionWorkflowServiceApi.StartQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse>(
      (request, done) => this.client.startQuestionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysQuestionWorkflowServiceApi.StartQuestionWorkflowRequest.fromPartial({ question: { description: record.message }, questionId: record.currencyCode })));
  }
}

/** Writes records to acme.labeling.v1.LabelingTaskQueryService. */
class SyncSeatMapIdLabelingTaskQuery implements SyncSeatMapIdTarget {
  private readonly client: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncSeatMapIdRecord): Promise<void> {
    await call<labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksResponse>(
      (request, done) => this.client.suggestLabelingTasks(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest.fromPartial({ orderBy: record.currencyCode, filter: { region: record.seatMapId } }));
  }
}

/** Reads acme.seating.v1.SeatMapCalculationService/QuoteSeatMap and hands what it keeps to the sink of its kind. */
export async function syncSeatMapId(runtime: Runtime): Promise<void> {
  const reader = new seatingSeatMapCalculationServiceApi.SeatMapCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<seatingSeatMapCalculationServiceApi.QuoteSeatMapRequest, seatingSeatMapCalculationServiceApi.QuoteSeatMapResponse>(
    (request, done) => reader.quoteSeatMap(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    seatingSeatMapCalculationServiceApi.QuoteSeatMapRequest.fromPartial({ seatMapId: "main-sync-seat-map-id" }));
  const record: SyncSeatMapIdRecord = {
    seatMapId: text.normalize(found.seatMap?.seatMapId ?? ""),
    currencyCode: text.normalize(found.breakdown?.currencyCode ?? ""),
    message: found.result?.message ?? "",
    name: found.seatMap?.name ?? "",
  };
  const sinks = new Map<string, SyncSeatMapIdTarget>();
  sinks.set("metric-series-validation", new SyncSeatMapIdMetricSeriesValidation(runtime));
  sinks.set("question-workflow", new SyncSeatMapIdQuestionWorkflow(runtime));
  sinks.set("labeling-task-query", new SyncSeatMapIdLabelingTaskQuery(runtime));
  await sinks.get("labeling-task-query")!.forward(record);
}
