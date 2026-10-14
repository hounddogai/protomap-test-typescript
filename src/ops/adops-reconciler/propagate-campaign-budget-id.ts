import * as campaignsCampaignBudgetValidationServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateCampaignBudgetId keeps of each NormalizeCampaignBudget response. */
interface PropagateCampaignBudgetIdRecord {
  referenceId: string;
  correlationId: string;
  status: string;
}

/** Where propagateCampaignBudgetId hands each record. */
interface PropagateCampaignBudgetIdWriter {
  forward(record: PropagateCampaignBudgetIdRecord): Promise<void>;
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class PropagateCampaignBudgetIdWebhookDeliveryQuery implements PropagateCampaignBudgetIdWriter {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateCampaignBudgetIdRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(
      (request, done) => this.client.summarizeWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest.fromPartial({ details: { format: record.correlationId }, reason: record.status, webhookDeliveryId: record.referenceId })));
  }
}

/** Writes records to acme.localization.v1.LocaleLifecycleService. */
class PropagateCampaignBudgetIdLocaleLifecycle implements PropagateCampaignBudgetIdWriter {
  private readonly client: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateCampaignBudgetIdRecord): Promise<void> {
    await call<localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest, localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse>(
      (request, done) => this.client.reinstateLocale(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest.fromPartial({ reason: record.status }));
  }
}

/** Passes records to acme.campaigns.v1.MarketingCampaignWorkflowService. */
class PropagateCampaignBudgetIdMarketingCampaignWorkflow implements PropagateCampaignBudgetIdWriter {
  private readonly client: campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateCampaignBudgetIdRecord): Promise<void> {
    await call<campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse>(
      (request, done) => this.client.startMarketingCampaignWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowRequest.fromPartial({ details: { step: record.status }, reason: record.correlationId }));
  }
}

/**
 * Reads acme.campaigns.v1.CampaignBudgetValidationService/NormalizeCampaignBudget and hands what it keeps to
 * the sink of its kind.
 */
export async function propagateCampaignBudgetId(runtime: Runtime): Promise<void> {
  const source = new campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse>(
    (request, done) => source.normalizeCampaignBudget(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest.fromPartial({ campaignBudgetId: "live-propagate-campaign-budget-id" }));
  const kept: PropagateCampaignBudgetIdRecord = {
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
    correlationId: found.result?.correlationId ?? "",
    status: text.normalize(found.outcome?.status ?? ""),
  };
  const registry: Record<string, PropagateCampaignBudgetIdWriter> = {};
  for (const entry of [
    { kind: "webhook-delivery-query", sink: new PropagateCampaignBudgetIdWebhookDeliveryQuery(runtime) },
    { kind: "locale-lifecycle", sink: new PropagateCampaignBudgetIdLocaleLifecycle(runtime) },
    { kind: "marketing-campaign-workflow", sink: new PropagateCampaignBudgetIdMarketingCampaignWorkflow(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["marketing-campaign-workflow"]!.forward(kept);
}
