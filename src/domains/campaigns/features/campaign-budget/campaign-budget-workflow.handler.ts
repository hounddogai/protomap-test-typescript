/**
 * Runs the long-lived workflow that takes a campaign budget from start to finish.
 */

import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { CampaignBudgetWorkflowWorkflow } from "./campaign-budget-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for CampaignBudgetWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignBudgetWorkflowHandler {
  constructor(@inject(CampaignBudgetWorkflowWorkflow) private readonly workflow: CampaignBudgetWorkflowWorkflow) {}

  /**
   * Advances a campaign budget.
   */
  advanceCampaignBudgetWorkflow = unary<campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse>(
    (request) => this.workflow.advanceCampaignBudgetWorkflow(request),
  );

  /**
   * Cancels a campaign budget.
   */
  cancelCampaignBudgetWorkflow = (call: ServerUnaryCall<campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse>, done: sendUnaryData<campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse>): void => {
    void this.workflow.cancelCampaignBudgetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a campaign budget.
   */
  inspectCampaignBudgetWorkflow = unary<campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowResponse>(
    (request) => this.workflow.inspectCampaignBudgetWorkflow(request),
  );

  /**
   * Lists campaign budgets a page at a time.
   */
  listCampaignBudgetWorkflows = unary<campaignsCampaignBudgetWorkflowServiceApi.ListCampaignBudgetWorkflowsRequest, campaignsCampaignBudgetWorkflowServiceApi.ListCampaignBudgetWorkflowsResponse>(
    (request) => this.workflow.listCampaignBudgetWorkflows(request),
  );

  /**
   * Pauses a campaign budget.
   */
  pauseCampaignBudgetWorkflow = (call: ServerUnaryCall<campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse>, done: sendUnaryData<campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse>): void => {
    void this.workflow.pauseCampaignBudgetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a campaign budget.
   */
  retryCampaignBudgetWorkflow = unary<campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse>(
    (request) => this.workflow.retryCampaignBudgetWorkflow(request),
  );

  /**
   * Starts a campaign budget.
   */
  startCampaignBudgetWorkflow = unary<campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowResponse>(
    (request) => this.workflow.startCampaignBudgetWorkflow(request),
  );
}

export function implementation(handler: CampaignBudgetWorkflowHandler): campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceServer {
  return {
    advanceCampaignBudgetWorkflow: handler.advanceCampaignBudgetWorkflow,
    cancelCampaignBudgetWorkflow: handler.cancelCampaignBudgetWorkflow,
    inspectCampaignBudgetWorkflow: handler.inspectCampaignBudgetWorkflow,
    listCampaignBudgetWorkflows: handler.listCampaignBudgetWorkflows,
    pauseCampaignBudgetWorkflow: handler.pauseCampaignBudgetWorkflow,
    retryCampaignBudgetWorkflow: handler.retryCampaignBudgetWorkflow,
    startCampaignBudgetWorkflow: handler.startCampaignBudgetWorkflow,
  };
}
