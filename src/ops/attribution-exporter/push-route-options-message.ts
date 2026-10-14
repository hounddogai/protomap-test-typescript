import * as audiencesAudienceMemberValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as routingRouteCalculationServiceApi from "../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushRouteOptionsMessage keeps of each CompareRouteOptions response. */
interface PushRouteOptionsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where pushRouteOptionsMessage hands each record. */
interface PushRouteOptionsMessageSink {
  push(record: PushRouteOptionsMessageRecord): Promise<void>;
}

/** Passes records to acme.webhooks.v1.WebhookEndpointWorkflowService. */
class PushRouteOptionsMessageWebhookEndpointWorkflow implements PushRouteOptionsMessageSink {
  private readonly client: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushRouteOptionsMessageRecord): Promise<void> {
    await call<webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowResponse>(
      (request, done) => this.client.inspectWebhookEndpointWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowRequest.fromPartial({ webhookEndpointId: record.correlationId }));
  }
}

/** Passes records to acme.campaigns.v1.CampaignBudgetValidationService. */
class PushRouteOptionsMessageCampaignBudgetValidation implements PushRouteOptionsMessageSink {
  private readonly client: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushRouteOptionsMessageRecord): Promise<void> {
    await call<campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest, campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse>(
      (request, done) => this.client.getCampaignBudgetRules(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest.fromPartial({ campaignBudgetId: record.correlationId }));
  }
}

/** Writes records to acme.audiences.v1.AudienceMemberValidationService. */
class PushRouteOptionsMessageAudienceMemberValidation implements PushRouteOptionsMessageSink {
  private readonly client: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushRouteOptionsMessageRecord): Promise<void> {
    await retry(() => call<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse>(
      (request, done) => this.client.previewAudienceMember(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest.fromPartial({ audienceMemberId: record.message })));
  }
}

/**
 * Reads acme.routing.v1.RouteCalculationService/CompareRouteOptions and hands what it keeps to the sink of
 * its kind.
 */
export async function pushRouteOptionsMessage(runtime: Runtime): Promise<void> {
  const reader = new routingRouteCalculationServiceApi.RouteCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<routingRouteCalculationServiceApi.CompareRouteOptionsRequest, routingRouteCalculationServiceApi.CompareRouteOptionsResponse>(
    (request, done) => reader.compareRouteOptions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    routingRouteCalculationServiceApi.CompareRouteOptionsRequest.fromPartial({ reason: "live-push-route-options-message" }));
  const record: PushRouteOptionsMessageRecord = {
    message: reply.result?.message ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const entries: Array<{ kind: string; sink: PushRouteOptionsMessageSink }> = [
    { kind: "webhook-endpoint-workflow", sink: new PushRouteOptionsMessageWebhookEndpointWorkflow(runtime) },
    { kind: "campaign-budget-validation", sink: new PushRouteOptionsMessageCampaignBudgetValidation(runtime) },
    { kind: "audience-member-validation", sink: new PushRouteOptionsMessageAudienceMemberValidation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "campaign-budget-validation") continue;
    await entry.sink.push(record);
  }
}
