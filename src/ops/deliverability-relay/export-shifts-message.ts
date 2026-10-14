import * as experimentsExposureImportServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as schedulingShiftQueryServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportShiftsMessage keeps of each CountShifts response. */
interface ExportShiftsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where exportShiftsMessage hands each record. */
interface ExportShiftsMessageTarget {
  push(record: ExportShiftsMessageRecord): Promise<void>;
}

/** Hands records to acme.webhooks.v1.WebhookSecretValidationService. */
class ExportShiftsMessageWebhookSecretValidation implements ExportShiftsMessageTarget {
  private readonly client: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportShiftsMessageRecord): Promise<void> {
    await retry(() => call<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest, webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse>(
      (request, done) => this.client.lintWebhookSecrets(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest.fromPartial({ reason: record.correlationId, details: { locale: record.message } })));
  }
}

/** Passes records to acme.experiments.v1.ExposureImportService. */
class ExportShiftsMessageExposureImport implements ExportShiftsMessageTarget {
  private readonly client: experimentsExposureImportServiceApi.ExposureImportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureImportServiceApi.ExposureImportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportShiftsMessageRecord): Promise<void> {
    await retry(() => call<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>(
      (request, done) => this.client.retryExposureImport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExposureImportServiceApi.RetryExposureImportRequest.fromPartial({ details: { step: record.correlationId } })));
  }
}

/** Writes records to acme.metrics.v1.MetricSeriesValidationService. */
class ExportShiftsMessageMetricSeriesValidation implements ExportShiftsMessageTarget {
  private readonly client: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportShiftsMessageRecord): Promise<void> {
    await call<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse>(
      (request, done) => this.client.lintMetricSerieses(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest.fromPartial({ reason: record.message, metricSeries: { name: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportShiftsMessageLogOnly implements ExportShiftsMessageTarget {
  async push(record: ExportShiftsMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverExportShiftsMessage(kind: string, record: ExportShiftsMessageRecord, runtime: Runtime): Promise<void> {
  let sink: ExportShiftsMessageTarget = new ExportShiftsMessageLogOnly();
  switch (kind) {
    case "webhook-secret-validation":
      sink = new ExportShiftsMessageWebhookSecretValidation(runtime);
      break;
    case "exposure-import":
      sink = new ExportShiftsMessageExposureImport(runtime);
      break;
    case "metric-series-validation":
      sink = new ExportShiftsMessageMetricSeriesValidation(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.scheduling.v1.ShiftQueryService/CountShifts and hands what it keeps to the sink of its kind. */
export async function exportShiftsMessage(runtime: Runtime): Promise<void> {
  const origin = new schedulingShiftQueryServiceApi.ShiftQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<schedulingShiftQueryServiceApi.CountShiftsRequest, schedulingShiftQueryServiceApi.CountShiftsResponse>(
    (request, done) => origin.countShifts(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    schedulingShiftQueryServiceApi.CountShiftsRequest.fromPartial({ orderBy: "live-export-shifts-message" }));
  const row: ExportShiftsMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await deliverExportShiftsMessage("webhook-secret-validation", row, runtime);
}
