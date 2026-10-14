import * as configurationConfigSetCalculationServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as featurestoreFeatureViewServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncGetFeatureViewsId keeps of each BatchGetFeatureViews response. */
interface SyncGetFeatureViewsIdRecord {
  correlationId: string;
  status: string;
}

/** Where syncGetFeatureViewsId hands each record. */
interface SyncGetFeatureViewsIdSink {
  apply(record: SyncGetFeatureViewsIdRecord): Promise<void>;
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class SyncGetFeatureViewsIdWebhookDeliveryQuery implements SyncGetFeatureViewsIdSink {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncGetFeatureViewsIdRecord): Promise<void> {
    await call<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(
      (request, done) => this.client.summarizeWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest.fromPartial({ webhookDeliveryId: record.status, details: { format: record.correlationId } }));
  }
}

/** Hands records to acme.configuration.v1.ConfigSetCalculationService. */
class SyncGetFeatureViewsIdConfigSetCalculation implements SyncGetFeatureViewsIdSink {
  private readonly client: configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncGetFeatureViewsIdRecord): Promise<void> {
    await retry(() => call<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>(
      (request, done) => this.client.explainConfigSetCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest.fromPartial({ details: { locale: record.status } })));
  }
}

/** Sends records to acme.media.v1.TranscodeJobValidationService. */
class SyncGetFeatureViewsIdTranscodeJobValidation implements SyncGetFeatureViewsIdSink {
  private readonly client: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncGetFeatureViewsIdRecord): Promise<void> {
    await call<mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesRequest, mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse>(
      (request, done) => this.client.getTranscodeJobRules(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesRequest.fromPartial({ transcodeJobId: record.correlationId }));
  }
}

/**
 * Reads acme.featurestore.v1.FeatureViewService/BatchGetFeatureViews and hands what it keeps to the sink of
 * its kind.
 */
export async function syncGetFeatureViewsId(runtime: Runtime): Promise<void> {
  const source = new featurestoreFeatureViewServiceApi.FeatureViewServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<featurestoreFeatureViewServiceApi.BatchGetFeatureViewsRequest, featurestoreFeatureViewServiceApi.BatchGetFeatureViewsResponse>(
    (request, done) => source.batchGetFeatureViews(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    featurestoreFeatureViewServiceApi.BatchGetFeatureViewsRequest.fromPartial({}));
  const record: SyncGetFeatureViewsIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    status: reply.result?.status ?? "",
  };
  const sinks = new Map<string, SyncGetFeatureViewsIdSink>();
  sinks.set("webhook-delivery-query", new SyncGetFeatureViewsIdWebhookDeliveryQuery(runtime));
  sinks.set("config-set-calculation", new SyncGetFeatureViewsIdConfigSetCalculation(runtime));
  sinks.set("transcode-job-validation", new SyncGetFeatureViewsIdTranscodeJobValidation(runtime));
  await sinks.get("transcode-job-validation")!.apply(record);
}
