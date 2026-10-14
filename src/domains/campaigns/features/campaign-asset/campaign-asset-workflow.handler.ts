/**
 * Runs the long-lived workflow that takes a campaign asset from start to finish.
 */

import * as campaignsCampaignAssetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { CampaignAssetWorkflowWorkflow } from "./campaign-asset-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for CampaignAssetWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignAssetWorkflowHandler {
  constructor(@inject(CampaignAssetWorkflowWorkflow) private readonly workflow: CampaignAssetWorkflowWorkflow) {}

  /**
   * Advances a campaign asset.
   */
  advanceCampaignAssetWorkflow = unary<campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse>(
    (request) => this.workflow.advanceCampaignAssetWorkflow(request),
  );

  /**
   * Cancels a campaign asset.
   */
  cancelCampaignAssetWorkflow = (call: ServerUnaryCall<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse>, done: sendUnaryData<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse>): void => {
    void this.workflow.cancelCampaignAssetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a campaign asset.
   */
  inspectCampaignAssetWorkflow = unary<campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowResponse>(
    (request) => this.workflow.inspectCampaignAssetWorkflow(request),
  );

  /**
   * Lists campaign assets a page at a time.
   */
  listCampaignAssetWorkflows = unary<campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsRequest, campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsResponse>(
    (request) => this.workflow.listCampaignAssetWorkflows(request),
  );

  /**
   * Pauses a campaign asset.
   */
  pauseCampaignAssetWorkflow = (call: ServerUnaryCall<campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse>, done: sendUnaryData<campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse>): void => {
    void this.workflow.pauseCampaignAssetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a campaign asset.
   */
  resumeCampaignAssetWorkflow = unary<campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse>(
    (request) => this.workflow.resumeCampaignAssetWorkflow(request),
  );

  /**
   * Retrys a campaign asset.
   */
  retryCampaignAssetWorkflow = unary<campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse>(
    (request) => this.workflow.retryCampaignAssetWorkflow(request),
  );

  /**
   * Signals a campaign asset.
   */
  signalCampaignAssetWorkflow = (call: ServerUnaryCall<campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse>, done: sendUnaryData<campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse>): void => {
    void this.workflow.signalCampaignAssetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a campaign asset.
   */
  startCampaignAssetWorkflow = unary<campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse>(
    (request) => this.workflow.startCampaignAssetWorkflow(request),
  );
}

export function implementation(handler: CampaignAssetWorkflowHandler): campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceServer {
  return {
    advanceCampaignAssetWorkflow: handler.advanceCampaignAssetWorkflow,
    cancelCampaignAssetWorkflow: handler.cancelCampaignAssetWorkflow,
    inspectCampaignAssetWorkflow: handler.inspectCampaignAssetWorkflow,
    listCampaignAssetWorkflows: handler.listCampaignAssetWorkflows,
    pauseCampaignAssetWorkflow: handler.pauseCampaignAssetWorkflow,
    resumeCampaignAssetWorkflow: handler.resumeCampaignAssetWorkflow,
    retryCampaignAssetWorkflow: handler.retryCampaignAssetWorkflow,
    signalCampaignAssetWorkflow: handler.signalCampaignAssetWorkflow,
    startCampaignAssetWorkflow: handler.startCampaignAssetWorkflow,
  };
}
