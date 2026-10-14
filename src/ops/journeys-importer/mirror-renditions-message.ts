import * as campaignsMarketingCampaignApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as itsmIncidentCalculationServiceApi from "../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorRenditionsMessage keeps of each RecalculateRenditions response. */
interface MirrorRenditionsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where mirrorRenditionsMessage hands each record. */
interface MirrorRenditionsMessageSink {
  send(record: MirrorRenditionsMessageRecord): Promise<void>;
}

/** Hands records to acme.itsm.v1.IncidentCalculationService. */
class MirrorRenditionsMessageIncidentCalculation implements MirrorRenditionsMessageSink {
  private readonly client: itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: MirrorRenditionsMessageRecord): Promise<void> {
    await retry(() => call<itsmIncidentCalculationServiceApi.ExplainIncidentCalculationRequest, itsmIncidentCalculationServiceApi.ExplainIncidentCalculationResponse>(
      (request, done) => this.client.explainIncidentCalculation(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      itsmIncidentCalculationServiceApi.ExplainIncidentCalculationRequest.fromPartial({ reason: record.correlationId, incident: { subject: record.message } })));
  }
}

/** Hands records to acme.personalization.v1.RecommendationWorkflowService. */
class MirrorRenditionsMessageRecommendationWorkflow implements MirrorRenditionsMessageSink {
  private readonly client: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: MirrorRenditionsMessageRecord): Promise<void> {
    await retry(() => call<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse>(
      (request, done) => this.client.pauseRecommendationWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest.fromPartial({ recommendation: { recommendationId: record.correlationId }, reason: record.message })));
  }
}

/** Hands records to acme.campaigns.v1.MarketingCampaignApprovalService. */
class MirrorRenditionsMessageMarketingCampaignApproval implements MirrorRenditionsMessageSink {
  private readonly client: campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: MirrorRenditionsMessageRecord): Promise<void> {
    await call<campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse>(
      (request, done) => this.client.escalateMarketingCampaign(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignRequest.fromPartial({ marketingCampaign: { title: record.message }, marketingCampaignId: record.correlationId }));
  }
}

/**
 * Reads acme.media.v1.RenditionCalculationService/RecalculateRenditions and hands what it keeps to the sink
 * of its kind.
 */
export async function mirrorRenditionsMessage(runtime: Runtime): Promise<void> {
  const source = new mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(
    (request, done) => source.recalculateRenditions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({ reason: "current-mirror-renditions-message" })));
  const record: MirrorRenditionsMessageRecord = {
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  const sinks = new Map<string, MirrorRenditionsMessageSink>();
  sinks.set("incident-calculation", new MirrorRenditionsMessageIncidentCalculation(runtime));
  sinks.set("recommendation-workflow", new MirrorRenditionsMessageRecommendationWorkflow(runtime));
  sinks.set("marketing-campaign-approval", new MirrorRenditionsMessageMarketingCampaignApproval(runtime));
  await sinks.get("marketing-campaign-approval")!.send(record);
}
