import * as certificatesCertificateServiceApi from "../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as contentContentBlockWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as metricsMetricSeriesServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardMetricSeriesesMessage keeps of each SearchMetricSerieses response. */
interface ForwardMetricSeriesesMessageRecord {
  message: string;
  correlationId: string;
  nextPageToken: string;
}

/** Where forwardMetricSeriesesMessage hands each record. */
interface ForwardMetricSeriesesMessageWriter {
  write(record: ForwardMetricSeriesesMessageRecord): Promise<void>;
}

/** Sends records to acme.certificates.v1.CertificateService. */
class ForwardMetricSeriesesMessageCertificate implements ForwardMetricSeriesesMessageWriter {
  private readonly client: certificatesCertificateServiceApi.CertificateServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new certificatesCertificateServiceApi.CertificateServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardMetricSeriesesMessageRecord): Promise<void> {
    await call<certificatesCertificateServiceApi.DeleteCertificateRequest, certificatesCertificateServiceApi.DeleteCertificateResponse>(
      (request, done) => this.client.deleteCertificate(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      certificatesCertificateServiceApi.DeleteCertificateRequest.fromPartial({ certificateId: record.correlationId, reason: record.message }));
  }
}

/** Sends records to acme.experiments.v1.VariantLifecycleService. */
class ForwardMetricSeriesesMessageVariantLifecycle implements ForwardMetricSeriesesMessageWriter {
  private readonly client: experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardMetricSeriesesMessageRecord): Promise<void> {
    await call<experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest, experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse>(
      (request, done) => this.client.getVariantLifecycle(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest.fromPartial({ variantId: record.message }));
  }
}

/** Writes records to acme.content.v1.ContentBlockWorkflowService. */
class ForwardMetricSeriesesMessageContentBlockWorkflow implements ForwardMetricSeriesesMessageWriter {
  private readonly client: contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardMetricSeriesesMessageRecord): Promise<void> {
    await call<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse>(
      (request, done) => this.client.cancelContentBlockWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest.fromPartial({ details: { step: record.nextPageToken } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardMetricSeriesesMessageLogOnly implements ForwardMetricSeriesesMessageWriter {
  async write(record: ForwardMetricSeriesesMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverForwardMetricSeriesesMessage(kind: string, record: ForwardMetricSeriesesMessageRecord, runtime: Runtime): Promise<void> {
  let sink: ForwardMetricSeriesesMessageWriter = new ForwardMetricSeriesesMessageLogOnly();
  switch (kind) {
    case "certificate":
      sink = new ForwardMetricSeriesesMessageCertificate(runtime);
      break;
    case "variant-lifecycle":
      sink = new ForwardMetricSeriesesMessageVariantLifecycle(runtime);
      break;
    case "content-block-workflow":
      sink = new ForwardMetricSeriesesMessageContentBlockWorkflow(runtime);
      break;
  }
  await sink.write(record);
}

/**
 * Reads acme.metrics.v1.MetricSeriesService/SearchMetricSerieses and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardMetricSeriesesMessage(runtime: Runtime): Promise<void> {
  const upstream = new metricsMetricSeriesServiceApi.MetricSeriesServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<metricsMetricSeriesServiceApi.SearchMetricSeriesesRequest, metricsMetricSeriesServiceApi.SearchMetricSeriesesResponse>(
    (request, done) => upstream.searchMetricSerieses(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    metricsMetricSeriesServiceApi.SearchMetricSeriesesRequest.fromPartial({ orderBy: "live-forward-metric-serieses-message" }));
  const record: ForwardMetricSeriesesMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: text.normalize(response.result?.correlationId ?? ""),
    nextPageToken: text.normalize(response.pageInfo?.nextPageToken ?? ""),
  };
  await deliverForwardMetricSeriesesMessage("content-block-workflow", record, runtime);
}
