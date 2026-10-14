/**
 * Routes marketing campaigns through approval, with escalation and delegation.
 */

import * as campaignsMarketingCampaignApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { MarketingCampaignApprovalWorkflow } from "../application/marketing-campaign-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MarketingCampaignApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class MarketingCampaignApprovalHandler {
  constructor(@inject(MarketingCampaignApprovalWorkflow) private readonly workflow: MarketingCampaignApprovalWorkflow) {}

  /**
   * Approves a marketing campaign.
   */
  approveMarketingCampaign = (call: ServerUnaryCall<campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse>, done: sendUnaryData<campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse>): void => {
    void this.workflow.approveMarketingCampaign(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a marketing campaign.
   */
  commentMarketingCampaignApproval = unary<campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalRequest, campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalResponse>(
    (request) => this.workflow.commentMarketingCampaignApproval(request),
  );

  /**
   * Delegates a marketing campaign.
   */
  delegateMarketingCampaignApproval = unary<campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalRequest, campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalResponse>(
    (request) => this.workflow.delegateMarketingCampaignApproval(request),
  );

  /**
   * Escalates a marketing campaign.
   */
  escalateMarketingCampaign = (call: ServerUnaryCall<campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse>, done: sendUnaryData<campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse>): void => {
    void this.workflow.escalateMarketingCampaign(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a marketing campaign.
   */
  getMarketingCampaignApprovalStatus = unary<campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusRequest, campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusResponse>(
    (request) => this.workflow.getMarketingCampaignApprovalStatus(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  listPendingMarketingCampaigns = unary<campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsRequest, campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsResponse>(
    (request) => this.workflow.listPendingMarketingCampaigns(request),
  );

  /**
   * Recalls a marketing campaign.
   */
  recallMarketingCampaign = (call: ServerUnaryCall<campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignResponse>, done: sendUnaryData<campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignResponse>): void => {
    void this.workflow.recallMarketingCampaign(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a marketing campaign.
   */
  rejectMarketingCampaign = unary<campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignResponse>(
    (request) => this.workflow.rejectMarketingCampaign(request),
  );

  /**
   * Submits a marketing campaign.
   */
  submitMarketingCampaign = unary<campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse>(
    (request) => this.workflow.submitMarketingCampaign(request),
  );
}

export function implementation(handler: MarketingCampaignApprovalHandler): campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceServer {
  return {
    approveMarketingCampaign: handler.approveMarketingCampaign,
    commentMarketingCampaignApproval: handler.commentMarketingCampaignApproval,
    delegateMarketingCampaignApproval: handler.delegateMarketingCampaignApproval,
    escalateMarketingCampaign: handler.escalateMarketingCampaign,
    getMarketingCampaignApprovalStatus: handler.getMarketingCampaignApprovalStatus,
    listPendingMarketingCampaigns: handler.listPendingMarketingCampaigns,
    recallMarketingCampaign: handler.recallMarketingCampaign,
    rejectMarketingCampaign: handler.rejectMarketingCampaign,
    submitMarketingCampaign: handler.submitMarketingCampaign,
  };
}
