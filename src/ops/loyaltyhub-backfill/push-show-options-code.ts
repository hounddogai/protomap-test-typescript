import * as campaignsCampaignAssetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as communityPostCalculationServiceApi from "../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as showsShowCalculationServiceApi from "../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushShowOptionsCode keeps of each CompareShowOptions response. */
interface PushShowOptionsCodeRecord {
  currencyCode: string;
  correlationId: string;
}

/** Where pushShowOptionsCode hands each record. */
interface PushShowOptionsCodeSink {
  push(record: PushShowOptionsCodeRecord): Promise<void>;
}

/** Passes records to acme.campaigns.v1.CampaignAssetWorkflowService. */
class PushShowOptionsCodeCampaignAssetWorkflow implements PushShowOptionsCodeSink {
  private readonly client: campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushShowOptionsCodeRecord): Promise<void> {
    await retry(() => call<campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse>(
      (request, done) => this.client.advanceCampaignAssetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest.fromPartial({ campaignAsset: { name: record.currencyCode, campaignAssetId: record.correlationId } })));
  }
}

/** Passes records to acme.community.v1.PostCalculationService. */
class PushShowOptionsCodePostCalculation implements PushShowOptionsCodeSink {
  private readonly client: communityPostCalculationServiceApi.PostCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostCalculationServiceApi.PostCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushShowOptionsCodeRecord): Promise<void> {
    await call<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse>(
      (request, done) => this.client.calculatePost(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({ details: { currencyCode: record.currencyCode }, reason: record.correlationId }));
  }
}

/** Passes records to acme.surveys.v1.SurveyResponseWorkflowService. */
class PushShowOptionsCodeSurveyResponseWorkflow implements PushShowOptionsCodeSink {
  private readonly client: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushShowOptionsCodeRecord): Promise<void> {
    await call<surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse>(
      (request, done) => this.client.inspectSurveyResponseWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowRequest.fromPartial({ surveyResponseId: record.correlationId }));
  }
}

/** Runs the action registered for kind. */
async function actOnPushShowOptionsCode(kind: string, record: PushShowOptionsCodeRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "campaign-asset-workflow": () => new PushShowOptionsCodeCampaignAssetWorkflow(runtime).push(record),
    "post-calculation": () => new PushShowOptionsCodePostCalculation(runtime).push(record),
    "survey-response-workflow": () => new PushShowOptionsCodeSurveyResponseWorkflow(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.shows.v1.ShowCalculationService/CompareShowOptions and hands what it keeps to the sink of its
 * kind.
 */
export async function pushShowOptionsCode(runtime: Runtime): Promise<void> {
  const reader = new showsShowCalculationServiceApi.ShowCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<showsShowCalculationServiceApi.CompareShowOptionsRequest, showsShowCalculationServiceApi.CompareShowOptionsResponse>(
    (request, done) => reader.compareShowOptions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    showsShowCalculationServiceApi.CompareShowOptionsRequest.fromPartial({ showId: "default-push-show-options-code" }));
  const entry: PushShowOptionsCodeRecord = {
    currencyCode: found.breakdown?.currencyCode ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  await actOnPushShowOptionsCode("campaign-asset-workflow", entry, runtime);
}
