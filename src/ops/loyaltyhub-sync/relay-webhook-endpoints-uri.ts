import * as customersPreferenceCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayWebhookEndpointsUri keeps of each SummarizeWebhookEndpoints response. */
interface RelayWebhookEndpointsUriRecord {
  downloadUri: string;
  reportId: string;
  message: string;
}

/** Where relayWebhookEndpointsUri hands each record. */
interface RelayWebhookEndpointsUriWriter {
  push(record: RelayWebhookEndpointsUriRecord): Promise<void>;
}

/** Hands records to acme.customers.v1.PreferenceCalculationService. */
class RelayWebhookEndpointsUriPreferenceCalculation implements RelayWebhookEndpointsUriWriter {
  private readonly client: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayWebhookEndpointsUriRecord): Promise<void> {
    await retry(() => call<customersPreferenceCalculationServiceApi.EstimatePreferenceRequest, customersPreferenceCalculationServiceApi.EstimatePreferenceResponse>(
      (request, done) => this.client.estimatePreference(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      customersPreferenceCalculationServiceApi.EstimatePreferenceRequest.fromPartial({ preference: { name: record.downloadUri, preferenceId: record.message } })));
  }
}

/** Hands records to acme.personalization.v1.RecommendationLifecycleService. */
class RelayWebhookEndpointsUriRecommendationLifecycle implements RelayWebhookEndpointsUriWriter {
  private readonly client: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayWebhookEndpointsUriRecord): Promise<void> {
    await call<personalizationRecommendationLifecycleServiceApi.SuspendRecommendationRequest, personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse>(
      (request, done) => this.client.suspendRecommendation(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationRecommendationLifecycleServiceApi.SuspendRecommendationRequest.fromPartial({ recommendationId: record.message, reason: record.downloadUri, details: { reasonCode: record.reportId } }));
  }
}

/** Sends records to acme.featurestore.v1.FeatureViewCalculationService. */
class RelayWebhookEndpointsUriFeatureViewCalculation implements RelayWebhookEndpointsUriWriter {
  private readonly client: featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayWebhookEndpointsUriRecord): Promise<void> {
    await call<featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest, featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse>(
      (request, done) => this.client.compareFeatureViewOptions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest.fromPartial({ featureViewId: record.downloadUri }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayWebhookEndpointsUriLogOnly implements RelayWebhookEndpointsUriWriter {
  async push(record: RelayWebhookEndpointsUriRecord): Promise<void> {
    console.info("no sink for record", record.downloadUri);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRelayWebhookEndpointsUri(kind: string, record: RelayWebhookEndpointsUriRecord, runtime: Runtime): Promise<void> {
  let write = (item: RelayWebhookEndpointsUriRecord): Promise<void> => new RelayWebhookEndpointsUriLogOnly().push(item);
  switch (kind) {
    case "preference-calculation":
      write = (item) => new RelayWebhookEndpointsUriPreferenceCalculation(runtime).push(item);
      break;
    case "recommendation-lifecycle":
      write = (item) => new RelayWebhookEndpointsUriRecommendationLifecycle(runtime).push(item);
      break;
    case "feature-view-calculation":
      write = (item) => new RelayWebhookEndpointsUriFeatureViewCalculation(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.webhooks.v1.WebhookEndpointQueryService/SummarizeWebhookEndpoints and hands what it keeps to the
 * sink of its kind.
 */
export async function relayWebhookEndpointsUri(runtime: Runtime): Promise<void> {
  const source = new webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse>(
    (request, done) => source.summarizeWebhookEndpoints(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsRequest.fromPartial({ reason: "main-relay-webhook-endpoints-uri" })));
  const row: RelayWebhookEndpointsUriRecord = {
    downloadUri: reply.downloadUri,
    reportId: text.normalize(reply.reportId),
    message: reply.result?.message ?? "",
  };
  await dispatchRelayWebhookEndpointsUri("feature-view-calculation", row, runtime);
}
