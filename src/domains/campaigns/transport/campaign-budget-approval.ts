/**
 * Routes campaign budgets through approval, with escalation and delegation.
 */

import * as campaignsCampaignBudgetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { CampaignBudgetApprovalWorkflow } from "../application/campaign-budget-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for CampaignBudgetApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignBudgetApprovalHandler {
  constructor(@inject(CampaignBudgetApprovalWorkflow) private readonly workflow: CampaignBudgetApprovalWorkflow) {}

  /**
   * Approves a campaign budget.
   */
  approveCampaignBudget = (call: ServerUnaryCall<campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse>, done: sendUnaryData<campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse>): void => {
    void this.workflow.approveCampaignBudget(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a campaign budget.
   */
  commentCampaignBudgetApproval = unary<campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalResponse>(
    (request) => this.workflow.commentCampaignBudgetApproval(request),
  );

  /**
   * Delegates a campaign budget.
   */
  delegateCampaignBudgetApproval = unary<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse>(
    (request) => this.workflow.delegateCampaignBudgetApproval(request),
  );

  /**
   * Recalls a campaign budget.
   */
  recallCampaignBudget = (call: ServerUnaryCall<campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse>, done: sendUnaryData<campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse>): void => {
    void this.workflow.recallCampaignBudget(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a campaign budget.
   */
  rejectCampaignBudget = unary<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse>(
    (request) => this.workflow.rejectCampaignBudget(request),
  );

  /**
   * Submits a campaign budget.
   */
  submitCampaignBudget = unary<campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetResponse>(
    (request) => this.workflow.submitCampaignBudget(request),
  );
}

export function implementation(handler: CampaignBudgetApprovalHandler): campaignsCampaignBudgetApprovalServiceApi.CampaignBudgetApprovalServiceServer {
  return {
    approveCampaignBudget: handler.approveCampaignBudget,
    commentCampaignBudgetApproval: handler.commentCampaignBudgetApproval,
    delegateCampaignBudgetApproval: handler.delegateCampaignBudgetApproval,
    recallCampaignBudget: handler.recallCampaignBudget,
    rejectCampaignBudget: handler.rejectCampaignBudget,
    submitCampaignBudget: handler.submitCampaignBudget,
  };
}
