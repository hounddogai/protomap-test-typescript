import * as messagingConversationApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillMetricSeriesId keeps of each LookupMetricSeries response. */
interface BackfillMetricSeriesIdRecord {
  metricSeriesId: string;
  name: string;
  status: string;
  message: string;
}

/** Where backfillMetricSeriesId hands each record. */
interface BackfillMetricSeriesIdDestination {
  apply(record: BackfillMetricSeriesIdRecord): Promise<void>;
}

/** Passes records to acme.webhooks.v1.WebhookDeliveryValidationService. */
class BackfillMetricSeriesIdWebhookDeliveryValidation implements BackfillMetricSeriesIdDestination {
  private readonly client: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillMetricSeriesIdRecord): Promise<void> {
    await call<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>(
      (request, done) => this.client.validateWebhookDelivery(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest.fromPartial({ webhookDelivery: { correlationId: record.metricSeriesId }, webhookDeliveryId: record.message, details: { locale: record.name } }));
  }
}

/** Hands records to acme.notifications.v1.NotificationTemplateQueryService. */
class BackfillMetricSeriesIdNotificationTemplateQuery implements BackfillMetricSeriesIdDestination {
  private readonly client: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillMetricSeriesIdRecord): Promise<void> {
    await call<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(
      (request, done) => this.client.browseNotificationTemplates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({ orderBy: record.name }));
  }
}

/** Sends records to acme.messaging.v1.ConversationApprovalService. */
class BackfillMetricSeriesIdConversationApproval implements BackfillMetricSeriesIdDestination {
  private readonly client: messagingConversationApprovalServiceApi.ConversationApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationApprovalServiceApi.ConversationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillMetricSeriesIdRecord): Promise<void> {
    await call<messagingConversationApprovalServiceApi.ListPendingConversationsRequest, messagingConversationApprovalServiceApi.ListPendingConversationsResponse>(
      (request, done) => this.client.listPendingConversations(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingConversationApprovalServiceApi.ListPendingConversationsRequest.fromPartial({ filter: { ownerId: record.name } }));
  }
}

/**
 * Reads acme.metrics.v1.MetricSeriesQueryService/LookupMetricSeries and hands what it keeps to the sink of
 * its kind.
 */
export async function backfillMetricSeriesId(runtime: Runtime): Promise<void> {
  const origin = new metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<metricsMetricSeriesQueryServiceApi.LookupMetricSeriesRequest, metricsMetricSeriesQueryServiceApi.LookupMetricSeriesResponse>(
    (request, done) => origin.lookupMetricSeries(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    metricsMetricSeriesQueryServiceApi.LookupMetricSeriesRequest.fromPartial({ metricSeriesId: "primary-backfill-metric-series-id" })));
  const row: BackfillMetricSeriesIdRecord = {
    metricSeriesId: current.metricSeries?.metricSeriesId ?? "",
    name: current.metricSeries?.name ?? "",
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  const sinks: BackfillMetricSeriesIdDestination[] = [
    new BackfillMetricSeriesIdWebhookDeliveryValidation(runtime),
    new BackfillMetricSeriesIdNotificationTemplateQuery(runtime),
    new BackfillMetricSeriesIdConversationApproval(runtime),
  ];
  await sinks[2]!.apply(row);
}
