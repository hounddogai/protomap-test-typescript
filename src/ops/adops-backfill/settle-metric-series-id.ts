import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleMetricSeriesId keeps of each CreateMetricSeries response. */
interface SettleMetricSeriesIdRecord {
  correlationId: string;
  code: string;
}

/** Where settleMetricSeriesId hands each record. */
interface SettleMetricSeriesIdDestination {
  forward(record: SettleMetricSeriesIdRecord): Promise<void>;
}

/** Passes records to acme.personalization.v1.AffinityReportingService. */
class SettleMetricSeriesIdAffinityReporting implements SettleMetricSeriesIdDestination {
  private readonly client: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityReportingServiceApi.AffinityReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleMetricSeriesIdRecord): Promise<void> {
    await call<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>(
      (request, done) => this.client.countAffinityTotals(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest.fromPartial({ filter: { query: record.code } }));
  }
}

/** Passes records to acme.notifications.v1.DeliveryAttemptExportService. */
class SettleMetricSeriesIdDeliveryAttemptExport implements SettleMetricSeriesIdDestination {
  private readonly client: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleMetricSeriesIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportResponse>(
      (request, done) => this.client.cancelDeliveryAttemptExport(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest.fromPartial({ reason: record.correlationId, deliveryAttemptId: record.code }));
  }
}

/** Writes records to acme.keymanagement.v1.CryptoKeyCalculationService. */
class SettleMetricSeriesIdCryptoKeyCalculation implements SettleMetricSeriesIdDestination {
  private readonly client: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleMetricSeriesIdRecord): Promise<void> {
    await retry(() => call<keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationRequest, keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationResponse>(
      (request, done) => this.client.explainCryptoKeyCalculation(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationRequest.fromPartial({ cryptoKeyId: record.code })));
  }
}

/** Only logs, for kinds no service takes yet. */
class SettleMetricSeriesIdLogOnly implements SettleMetricSeriesIdDestination {
  async forward(record: SettleMetricSeriesIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSettleMetricSeriesId(kind: string, record: SettleMetricSeriesIdRecord, runtime: Runtime): Promise<void> {
  let sink: SettleMetricSeriesIdDestination = new SettleMetricSeriesIdLogOnly();
  switch (kind) {
    case "affinity-reporting":
      sink = new SettleMetricSeriesIdAffinityReporting(runtime);
      break;
    case "delivery-attempt-export":
      sink = new SettleMetricSeriesIdDeliveryAttemptExport(runtime);
      break;
    case "crypto-key-calculation":
      sink = new SettleMetricSeriesIdCryptoKeyCalculation(runtime);
      break;
  }
  await sink.forward(record);
}

/** Reads acme.metrics.v1.MetricSeriesService/CreateMetricSeries and hands what it keeps to the sink of its kind. */
export async function settleMetricSeriesId(runtime: Runtime): Promise<void> {
  const origin = new metricsMetricSeriesServiceApi.MetricSeriesServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<metricsMetricSeriesServiceApi.CreateMetricSeriesRequest, metricsMetricSeriesServiceApi.CreateMetricSeriesResponse>(
    (request, done) => origin.createMetricSeries(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    metricsMetricSeriesServiceApi.CreateMetricSeriesRequest.fromPartial({ requestId: "primary-settle-metric-series-id" }));
  const record: SettleMetricSeriesIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    code: found.metricSeries?.code ?? "",
  };
  await deliverSettleMetricSeriesId("affinity-reporting", record, runtime);
}
