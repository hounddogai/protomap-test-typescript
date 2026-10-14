import * as personalizationProfileReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayRecommendationId keeps of each QuoteRecommendation response. */
interface RelayRecommendationIdRecord {
  recommendationId: string;
  correlationId: string;
  status: string;
}

/** Where relayRecommendationId hands each record. */
interface RelayRecommendationIdTarget {
  deliver(record: RelayRecommendationIdRecord): Promise<void>;
}

/** Sends records to acme.webbff.v1.PageCompositionNotificationService. */
class RelayRecommendationIdPageCompositionNotification implements RelayRecommendationIdTarget {
  private readonly client: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayRecommendationIdRecord): Promise<void> {
    await retry(() => call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(
      (request, done) => this.client.subscribePageCompositionUpdates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({ pageCompositionId: record.correlationId, details: { channel: record.status, templateId: record.recommendationId } })));
  }
}

/** Writes records to acme.personalization.v1.ProfileReportingService. */
class RelayRecommendationIdProfileReporting implements RelayRecommendationIdTarget {
  private readonly client: personalizationProfileReportingServiceApi.ProfileReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileReportingServiceApi.ProfileReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayRecommendationIdRecord): Promise<void> {
    await retry(() => call<personalizationProfileReportingServiceApi.DeleteProfileReportRequest, personalizationProfileReportingServiceApi.DeleteProfileReportResponse>(
      (request, done) => this.client.deleteProfileReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationProfileReportingServiceApi.DeleteProfileReportRequest.fromPartial({ reason: record.recommendationId, profileId: record.correlationId, etag: record.status })));
  }
}

/** Passes records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class RelayRecommendationIdWebhookDeliveryQuery implements RelayRecommendationIdTarget {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayRecommendationIdRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse>(
      (request, done) => this.client.countWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest.fromPartial({ filter: { ownerId: record.correlationId, region: record.status }, page: { pageToken: record.recommendationId } })));
  }
}

/**
 * Reads acme.personalization.v1.RecommendationCalculationService/QuoteRecommendation and hands what it keeps
 * to the sink of its kind.
 */
export async function relayRecommendationId(runtime: Runtime): Promise<void> {
  const source = new personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>(
    (request, done) => source.quoteRecommendation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({ reason: "default-relay-recommendation-id" })));
  const entry: RelayRecommendationIdRecord = {
    recommendationId: response.recommendation?.recommendationId ?? "",
    correlationId: response.result?.correlationId ?? "",
    status: response.result?.status ?? "",
  };
  const entries: Array<{ kind: string; sink: RelayRecommendationIdTarget }> = [
    { kind: "page-composition-notification", sink: new RelayRecommendationIdPageCompositionNotification(runtime) },
    { kind: "profile-reporting", sink: new RelayRecommendationIdProfileReporting(runtime) },
    { kind: "webhook-delivery-query", sink: new RelayRecommendationIdWebhookDeliveryQuery(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "webhook-delivery-query") continue;
    await entry.sink.deliver(entry);
  }
}
