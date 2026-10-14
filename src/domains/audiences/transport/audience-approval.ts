/**
 * Routes audiences through approval, with escalation and delegation.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AudienceApprovalWorkflow } from "../application/audience-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceApprovalHandler {
  constructor(@inject(AudienceApprovalWorkflow) private readonly workflow: AudienceApprovalWorkflow) {}

  /**
   * Approves an audience.
   */
  approveAudience = (call: ServerUnaryCall<audiencesAudienceApprovalServiceApi.ApproveAudienceRequest, audiencesAudienceApprovalServiceApi.ApproveAudienceResponse>, done: sendUnaryData<audiencesAudienceApprovalServiceApi.ApproveAudienceResponse>): void => {
    void this.workflow.approveAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments an audience.
   */
  commentAudienceApproval = unary<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse>(
    (request) => this.workflow.commentAudienceApproval(request),
  );

  /**
   * Delegates an audience.
   */
  delegateAudienceApproval = unary<audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse>(
    (request) => this.workflow.delegateAudienceApproval(request),
  );

  /**
   * Escalates an audience.
   */
  escalateAudience = (call: ServerUnaryCall<audiencesAudienceApprovalServiceApi.EscalateAudienceRequest, audiencesAudienceApprovalServiceApi.EscalateAudienceResponse>, done: sendUnaryData<audiencesAudienceApprovalServiceApi.EscalateAudienceResponse>): void => {
    void this.workflow.escalateAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience.
   */
  getAudienceApprovalStatus = unary<audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusRequest, audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse>(
    (request) => this.workflow.getAudienceApprovalStatus(request),
  );

  /**
   * Lists audiences a page at a time.
   */
  listPendingAudiences = unary<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse>(
    (request) => this.workflow.listPendingAudiences(request),
  );

  /**
   * Recalls an audience.
   */
  recallAudience = (call: ServerUnaryCall<audiencesAudienceApprovalServiceApi.RecallAudienceRequest, audiencesAudienceApprovalServiceApi.RecallAudienceResponse>, done: sendUnaryData<audiencesAudienceApprovalServiceApi.RecallAudienceResponse>): void => {
    void this.workflow.recallAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects an audience.
   */
  rejectAudience = unary<audiencesAudienceApprovalServiceApi.RejectAudienceRequest, audiencesAudienceApprovalServiceApi.RejectAudienceResponse>(
    (request) => this.workflow.rejectAudience(request),
  );

  /**
   * Submits an audience.
   */
  submitAudience = unary<audiencesAudienceApprovalServiceApi.SubmitAudienceRequest, audiencesAudienceApprovalServiceApi.SubmitAudienceResponse>(
    (request) => this.workflow.submitAudience(request),
  );
}

export function implementation(handler: AudienceApprovalHandler): audiencesAudienceApprovalServiceApi.AudienceApprovalServiceServer {
  return {
    approveAudience: handler.approveAudience,
    commentAudienceApproval: handler.commentAudienceApproval,
    delegateAudienceApproval: handler.delegateAudienceApproval,
    escalateAudience: handler.escalateAudience,
    getAudienceApprovalStatus: handler.getAudienceApprovalStatus,
    listPendingAudiences: handler.listPendingAudiences,
    recallAudience: handler.recallAudience,
    rejectAudience: handler.rejectAudience,
    submitAudience: handler.submitAudience,
  };
}
