/**
 * Routes audience syncs through approval, with escalation and delegation.
 */

import * as audiencesAudienceSyncApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AudienceSyncApprovalWorkflow } from "./audience-sync-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceSyncApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceSyncApprovalHandler {
  constructor(@inject(AudienceSyncApprovalWorkflow) private readonly workflow: AudienceSyncApprovalWorkflow) {}

  /**
   * Approves an audience sync.
   */
  approveAudienceSync = unary<audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncResponse>(
    (request) => this.workflow.approveAudienceSync(request),
  );

  /**
   * Comments an audience sync.
   */
  commentAudienceSyncApproval = (call: ServerUnaryCall<audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalRequest, audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse>, done: sendUnaryData<audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse>): void => {
    void this.workflow.commentAudienceSyncApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates an audience sync.
   */
  delegateAudienceSyncApproval = unary<audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalRequest, audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalResponse>(
    (request) => this.workflow.delegateAudienceSyncApproval(request),
  );

  /**
   * Escalates an audience sync.
   */
  escalateAudienceSync = unary<audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse>(
    (request) => this.workflow.escalateAudienceSync(request),
  );

  /**
   * Returns an audience sync.
   */
  getAudienceSyncApprovalStatus = (call: ServerUnaryCall<audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusRequest, audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusResponse>, done: sendUnaryData<audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusResponse>): void => {
    void this.workflow.getAudienceSyncApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists audience syncs a page at a time.
   */
  listPendingAudienceSyncs = unary<audiencesAudienceSyncApprovalServiceApi.ListPendingAudienceSyncsRequest, audiencesAudienceSyncApprovalServiceApi.ListPendingAudienceSyncsResponse>(
    (request) => this.workflow.listPendingAudienceSyncs(request),
  );

  /**
   * Recalls an audience sync.
   */
  recallAudienceSync = unary<audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncResponse>(
    (request) => this.workflow.recallAudienceSync(request),
  );

  /**
   * Rejects an audience sync.
   */
  rejectAudienceSync = (call: ServerUnaryCall<audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse>, done: sendUnaryData<audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse>): void => {
    void this.workflow.rejectAudienceSync(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits an audience sync.
   */
  submitAudienceSync = unary<audiencesAudienceSyncApprovalServiceApi.SubmitAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.SubmitAudienceSyncResponse>(
    (request) => this.workflow.submitAudienceSync(request),
  );
}

export function implementation(handler: AudienceSyncApprovalHandler): audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceServer {
  return {
    approveAudienceSync: handler.approveAudienceSync,
    commentAudienceSyncApproval: handler.commentAudienceSyncApproval,
    delegateAudienceSyncApproval: handler.delegateAudienceSyncApproval,
    escalateAudienceSync: handler.escalateAudienceSync,
    getAudienceSyncApprovalStatus: handler.getAudienceSyncApprovalStatus,
    listPendingAudienceSyncs: handler.listPendingAudienceSyncs,
    recallAudienceSync: handler.recallAudienceSync,
    rejectAudienceSync: handler.rejectAudienceSync,
    submitAudienceSync: handler.submitAudienceSync,
  };
}
