/**
 * Runs the long-lived workflow that takes a marketing campaign from start to finish.
 */

import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { MarketingCampaignWorkflowWorkflow } from "../application/marketing-campaign-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MarketingCampaignWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class MarketingCampaignWorkflowHandler {
  constructor(@inject(MarketingCampaignWorkflowWorkflow) private readonly workflow: MarketingCampaignWorkflowWorkflow) {}

  /**
   * Advances a marketing campaign.
   */
  advanceMarketingCampaignWorkflow = (call: ServerUnaryCall<campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse>, done: sendUnaryData<campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse>): void => {
    void this.workflow.advanceMarketingCampaignWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a marketing campaign.
   */
  cancelMarketingCampaignWorkflow = unary<campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse>(
    (request) => this.workflow.cancelMarketingCampaignWorkflow(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  listMarketingCampaignWorkflows = unary<campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsRequest, campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsResponse>(
    (request) => this.workflow.listMarketingCampaignWorkflows(request),
  );

  /**
   * Pauses a marketing campaign.
   */
  pauseMarketingCampaignWorkflow = (call: ServerUnaryCall<campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse>, done: sendUnaryData<campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse>): void => {
    void this.workflow.pauseMarketingCampaignWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a marketing campaign.
   */
  resumeMarketingCampaignWorkflow = unary<campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse>(
    (request) => this.workflow.resumeMarketingCampaignWorkflow(request),
  );

  /**
   * Signals a marketing campaign.
   */
  signalMarketingCampaignWorkflow = unary<campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowResponse>(
    (request) => this.workflow.signalMarketingCampaignWorkflow(request),
  );

  /**
   * Starts a marketing campaign.
   */
  startMarketingCampaignWorkflow = (call: ServerUnaryCall<campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse>, done: sendUnaryData<campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse>): void => {
    void this.workflow.startMarketingCampaignWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: MarketingCampaignWorkflowHandler): campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceServer {
  return {
    advanceMarketingCampaignWorkflow: handler.advanceMarketingCampaignWorkflow,
    cancelMarketingCampaignWorkflow: handler.cancelMarketingCampaignWorkflow,
    listMarketingCampaignWorkflows: handler.listMarketingCampaignWorkflows,
    pauseMarketingCampaignWorkflow: handler.pauseMarketingCampaignWorkflow,
    resumeMarketingCampaignWorkflow: handler.resumeMarketingCampaignWorkflow,
    signalMarketingCampaignWorkflow: handler.signalMarketingCampaignWorkflow,
    startMarketingCampaignWorkflow: handler.startMarketingCampaignWorkflow,
  };
}
