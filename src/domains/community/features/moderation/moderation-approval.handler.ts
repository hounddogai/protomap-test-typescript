/**
 * Routes moderations through approval, with escalation and delegation.
 */

import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ModerationApprovalWorkflow } from "./moderation-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ModerationApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ModerationApprovalHandler {
  constructor(@inject(ModerationApprovalWorkflow) private readonly workflow: ModerationApprovalWorkflow) {}

  /**
   * Approves a moderation.
   */
  approveModeration = unary<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse>(
    (request) => this.workflow.approveModeration(request),
  );

  /**
   * Comments a moderation.
   */
  commentModerationApproval = (call: ServerUnaryCall<communityModerationApprovalServiceApi.CommentModerationApprovalRequest, communityModerationApprovalServiceApi.CommentModerationApprovalResponse>, done: sendUnaryData<communityModerationApprovalServiceApi.CommentModerationApprovalResponse>): void => {
    void this.workflow.commentModerationApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a moderation.
   */
  delegateModerationApproval = unary<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse>(
    (request) => this.workflow.delegateModerationApproval(request),
  );

  /**
   * Escalates a moderation.
   */
  escalateModeration = unary<communityModerationApprovalServiceApi.EscalateModerationRequest, communityModerationApprovalServiceApi.EscalateModerationResponse>(
    (request) => this.workflow.escalateModeration(request),
  );

  /**
   * Lists moderations a page at a time.
   */
  listPendingModerations = (call: ServerUnaryCall<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>, done: sendUnaryData<communityModerationApprovalServiceApi.ListPendingModerationsResponse>): void => {
    void this.workflow.listPendingModerations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a moderation.
   */
  recallModeration = unary<communityModerationApprovalServiceApi.RecallModerationRequest, communityModerationApprovalServiceApi.RecallModerationResponse>(
    (request) => this.workflow.recallModeration(request),
  );

  /**
   * Rejects a moderation.
   */
  rejectModeration = unary<communityModerationApprovalServiceApi.RejectModerationRequest, communityModerationApprovalServiceApi.RejectModerationResponse>(
    (request) => this.workflow.rejectModeration(request),
  );

  /**
   * Submits a moderation.
   */
  submitModeration = (call: ServerUnaryCall<communityModerationApprovalServiceApi.SubmitModerationRequest, communityModerationApprovalServiceApi.SubmitModerationResponse>, done: sendUnaryData<communityModerationApprovalServiceApi.SubmitModerationResponse>): void => {
    void this.workflow.submitModeration(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ModerationApprovalHandler): communityModerationApprovalServiceApi.ModerationApprovalServiceServer {
  return {
    approveModeration: handler.approveModeration,
    commentModerationApproval: handler.commentModerationApproval,
    delegateModerationApproval: handler.delegateModerationApproval,
    escalateModeration: handler.escalateModeration,
    listPendingModerations: handler.listPendingModerations,
    recallModeration: handler.recallModeration,
    rejectModeration: handler.rejectModeration,
    submitModeration: handler.submitModeration,
  };
}
