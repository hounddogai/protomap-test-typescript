import * as inventoryStockItemQueryServiceApi from "../../../.cache/proto/acme/inventory/v1/stock_item_query_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as surveysSurveyQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportStockItemsMessage keeps of each FindStockItems response. */
interface ExportStockItemsMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where exportStockItemsMessage hands each record. */
interface ExportStockItemsMessageSink {
  apply(record: ExportStockItemsMessageRecord): Promise<void>;
}

/** Hands records to acme.metrics.v1.MetricSeriesQueryService. */
class ExportStockItemsMessageMetricSeriesQuery implements ExportStockItemsMessageSink {
  private readonly client: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportStockItemsMessageRecord): Promise<void> {
    await retry(() => call<metricsMetricSeriesQueryServiceApi.PeekMetricSeriesRequest, metricsMetricSeriesQueryServiceApi.PeekMetricSeriesResponse>(
      (request, done) => this.client.peekMetricSeries(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      metricsMetricSeriesQueryServiceApi.PeekMetricSeriesRequest.fromPartial({ metricSeriesId: record.status })));
  }
}

/** Passes records to acme.surveys.v1.SurveyQueryService. */
class ExportStockItemsMessageSurveyQuery implements ExportStockItemsMessageSink {
  private readonly client: surveysSurveyQueryServiceApi.SurveyQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyQueryServiceApi.SurveyQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportStockItemsMessageRecord): Promise<void> {
    await call<surveysSurveyQueryServiceApi.BrowseSurveysRequest, surveysSurveyQueryServiceApi.BrowseSurveysResponse>(
      (request, done) => this.client.browseSurveys(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyQueryServiceApi.BrowseSurveysRequest.fromPartial({ filter: { query: record.message, region: record.correlationId } }));
  }
}

/** Sends records to acme.personalization.v1.ProfileCalculationService. */
class ExportStockItemsMessageProfileCalculation implements ExportStockItemsMessageSink {
  private readonly client: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportStockItemsMessageRecord): Promise<void> {
    await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(
      (request, done) => this.client.explainProfileCalculation(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({ profileId: record.correlationId }));
  }
}

/** Reads acme.inventory.v1.StockItemQueryService/FindStockItems and hands what it keeps to the sink of its kind. */
export async function exportStockItemsMessage(runtime: Runtime): Promise<void> {
  const reader = new inventoryStockItemQueryServiceApi.StockItemQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<inventoryStockItemQueryServiceApi.FindStockItemsRequest, inventoryStockItemQueryServiceApi.FindStockItemsResponse>(
    (request, done) => reader.findStockItems(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    inventoryStockItemQueryServiceApi.FindStockItemsRequest.fromPartial({ orderBy: "live-export-stock-items-message" }));
  const row: ExportStockItemsMessageRecord = {
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
    status: text.normalize(found.result?.status ?? ""),
  };
  const entries: Array<{ kind: string; sink: ExportStockItemsMessageSink }> = [
    { kind: "metric-series-query", sink: new ExportStockItemsMessageMetricSeriesQuery(runtime) },
    { kind: "survey-query", sink: new ExportStockItemsMessageSurveyQuery(runtime) },
    { kind: "profile-calculation", sink: new ExportStockItemsMessageProfileCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "metric-series-query") continue;
    await entry.sink.apply(row);
  }
}
