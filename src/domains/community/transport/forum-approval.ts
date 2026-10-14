/**
 * Routes forums through approval, with escalation and delegation.
 */

import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ForumApprovalWorkflow } from "../application/forum-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ForumApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ForumApprovalHandler {
  constructor(@inject(ForumApprovalWorkflow) private readonly workflow: ForumApprovalWorkflow) {}

  /**
   * Approves a forum.
   */
  approveForum = (call: ServerUnaryCall<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse>, done: sendUnaryData<communityForumApprovalServiceApi.ApproveForumResponse>): void => {
    void this.workflow.approveForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a forum.
   */
  commentForumApproval = unary<communityForumApprovalServiceApi.CommentForumApprovalRequest, communityForumApprovalServiceApi.CommentForumApprovalResponse>(
    (request) => this.workflow.commentForumApproval(request),
  );

  /**
   * Delegates a forum.
   */
  delegateForumApproval = unary<communityForumApprovalServiceApi.DelegateForumApprovalRequest, communityForumApprovalServiceApi.DelegateForumApprovalResponse>(
    (request) => this.workflow.delegateForumApproval(request),
  );

  /**
   * Escalates a forum.
   */
  escalateForum = (call: ServerUnaryCall<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse>, done: sendUnaryData<communityForumApprovalServiceApi.EscalateForumResponse>): void => {
    void this.workflow.escalateForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a forum.
   */
  getForumApprovalStatus = unary<communityForumApprovalServiceApi.GetForumApprovalStatusRequest, communityForumApprovalServiceApi.GetForumApprovalStatusResponse>(
    (request) => this.workflow.getForumApprovalStatus(request),
  );

  /**
   * Lists forums a page at a time.
   */
  listPendingForums = unary<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(
    (request) => this.workflow.listPendingForums(request),
  );

  /**
   * Recalls a forum.
   */
  recallForum = (call: ServerUnaryCall<communityForumApprovalServiceApi.RecallForumRequest, communityForumApprovalServiceApi.RecallForumResponse>, done: sendUnaryData<communityForumApprovalServiceApi.RecallForumResponse>): void => {
    void this.workflow.recallForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a forum.
   */
  rejectForum = unary<communityForumApprovalServiceApi.RejectForumRequest, communityForumApprovalServiceApi.RejectForumResponse>(
    (request) => this.workflow.rejectForum(request),
  );

  /**
   * Submits a forum.
   */
  submitForum = unary<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(
    (request) => this.workflow.submitForum(request),
  );
}

export function implementation(handler: ForumApprovalHandler): communityForumApprovalServiceApi.ForumApprovalServiceServer {
  return {
    approveForum: handler.approveForum,
    commentForumApproval: handler.commentForumApproval,
    delegateForumApproval: handler.delegateForumApproval,
    escalateForum: handler.escalateForum,
    getForumApprovalStatus: handler.getForumApprovalStatus,
    listPendingForums: handler.listPendingForums,
    recallForum: handler.recallForum,
    rejectForum: handler.rejectForum,
    submitForum: handler.submitForum,
  };
}
