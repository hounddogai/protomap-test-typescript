/**
 * Routes campaign assets through approval, with escalation and delegation.
 */

import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { CampaignAssetApprovalWorkflow } from "../application/campaign-asset-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for CampaignAssetApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignAssetApprovalHandler {
  constructor(@inject(CampaignAssetApprovalWorkflow) private readonly workflow: CampaignAssetApprovalWorkflow) {}

  /**
   * Approves a campaign asset.
   */
  approveCampaignAsset = (call: ServerUnaryCall<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse>, done: sendUnaryData<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse>): void => {
    void this.workflow.approveCampaignAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a campaign asset.
   */
  commentCampaignAssetApproval = unary<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse>(
    (request) => this.workflow.commentCampaignAssetApproval(request),
  );

  /**
   * Delegates a campaign asset.
   */
  delegateCampaignAssetApproval = unary<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse>(
    (request) => this.workflow.delegateCampaignAssetApproval(request),
  );

  /**
   * Escalates a campaign asset.
   */
  escalateCampaignAsset = (call: ServerUnaryCall<campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse>, done: sendUnaryData<campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse>): void => {
    void this.workflow.escalateCampaignAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists campaign assets a page at a time.
   */
  listPendingCampaignAssets = unary<campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest, campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsResponse>(
    (request) => this.workflow.listPendingCampaignAssets(request),
  );

  /**
   * Recalls a campaign asset.
   */
  recallCampaignAsset = unary<campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetResponse>(
    (request) => this.workflow.recallCampaignAsset(request),
  );

  /**
   * Rejects a campaign asset.
   */
  rejectCampaignAsset = (call: ServerUnaryCall<campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse>, done: sendUnaryData<campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse>): void => {
    void this.workflow.rejectCampaignAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a campaign asset.
   */
  submitCampaignAsset = unary<campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetResponse>(
    (request) => this.workflow.submitCampaignAsset(request),
  );
}

export function implementation(handler: CampaignAssetApprovalHandler): campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceServer {
  return {
    approveCampaignAsset: handler.approveCampaignAsset,
    commentCampaignAssetApproval: handler.commentCampaignAssetApproval,
    delegateCampaignAssetApproval: handler.delegateCampaignAssetApproval,
    escalateCampaignAsset: handler.escalateCampaignAsset,
    listPendingCampaignAssets: handler.listPendingCampaignAssets,
    recallCampaignAsset: handler.recallCampaignAsset,
    rejectCampaignAsset: handler.rejectCampaignAsset,
    submitCampaignAsset: handler.submitCampaignAsset,
  };
}
