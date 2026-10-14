import * as campaignsCampaignAssetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as careplansCarePlanServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncCarePlanId keeps of each GetCarePlan response. */
interface SyncCarePlanIdRecord {
  correlationId: string;
  status: string;
}

/** Where syncCarePlanId hands each record. */
interface SyncCarePlanIdWriter {
  push(record: SyncCarePlanIdRecord): Promise<void>;
}

/** Writes records to acme.campaigns.v1.CampaignAssetWorkflowService. */
class SyncCarePlanIdCampaignAssetWorkflow implements SyncCarePlanIdWriter {
  private readonly client: campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SyncCarePlanIdRecord): Promise<void> {
    await call<campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse>(
      (request, done) => this.client.startCampaignAssetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest.fromPartial({ campaignAsset: { code: record.status, campaignAssetId: record.correlationId } }));
  }
}

/**
 * Reads acme.careplans.v1.CarePlanService/GetCarePlan and hands what it keeps to
 * acme.campaigns.v1.CampaignAssetWorkflowService.
 */
export async function syncCarePlanId(runtime: Runtime): Promise<void> {
  const reader = new careplansCarePlanServiceApi.CarePlanServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<careplansCarePlanServiceApi.GetCarePlanRequest, careplansCarePlanServiceApi.GetCarePlanResponse>(
    (request, done) => reader.getCarePlan(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    careplansCarePlanServiceApi.GetCarePlanRequest.fromPartial({ carePlanId: "main-sync-care-plan-id" })));
  const kept: SyncCarePlanIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    status: reply.result?.status ?? "",
  };
  await new SyncCarePlanIdCampaignAssetWorkflow(runtime).push(kept);
}
