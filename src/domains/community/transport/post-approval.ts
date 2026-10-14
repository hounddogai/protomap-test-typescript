/**
 * Routes posts through approval, with escalation and delegation.
 */

import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { PostApprovalWorkflow } from "../application/post-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PostApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class PostApprovalHandler {
  constructor(@inject(PostApprovalWorkflow) private readonly workflow: PostApprovalWorkflow) {}

  /**
   * Approves a post.
   */
  approvePost = (call: ServerUnaryCall<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse>, done: sendUnaryData<communityPostApprovalServiceApi.ApprovePostResponse>): void => {
    void this.workflow.approvePost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a post.
   */
  commentPostApproval = unary<communityPostApprovalServiceApi.CommentPostApprovalRequest, communityPostApprovalServiceApi.CommentPostApprovalResponse>(
    (request) => this.workflow.commentPostApproval(request),
  );

  /**
   * Delegates a post.
   */
  delegatePostApproval = unary<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(
    (request) => this.workflow.delegatePostApproval(request),
  );

  /**
   * Escalates a post.
   */
  escalatePost = (call: ServerUnaryCall<communityPostApprovalServiceApi.EscalatePostRequest, communityPostApprovalServiceApi.EscalatePostResponse>, done: sendUnaryData<communityPostApprovalServiceApi.EscalatePostResponse>): void => {
    void this.workflow.escalatePost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a post.
   */
  getPostApprovalStatus = unary<communityPostApprovalServiceApi.GetPostApprovalStatusRequest, communityPostApprovalServiceApi.GetPostApprovalStatusResponse>(
    (request) => this.workflow.getPostApprovalStatus(request),
  );

  /**
   * Recalls a post.
   */
  recallPost = unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(
    (request) => this.workflow.recallPost(request),
  );

  /**
   * Rejects a post.
   */
  rejectPost = (call: ServerUnaryCall<communityPostApprovalServiceApi.RejectPostRequest, communityPostApprovalServiceApi.RejectPostResponse>, done: sendUnaryData<communityPostApprovalServiceApi.RejectPostResponse>): void => {
    void this.workflow.rejectPost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a post.
   */
  submitPost = unary<communityPostApprovalServiceApi.SubmitPostRequest, communityPostApprovalServiceApi.SubmitPostResponse>(
    (request) => this.workflow.submitPost(request),
  );
}

export function implementation(handler: PostApprovalHandler): communityPostApprovalServiceApi.PostApprovalServiceServer {
  return {
    approvePost: handler.approvePost,
    commentPostApproval: handler.commentPostApproval,
    delegatePostApproval: handler.delegatePostApproval,
    escalatePost: handler.escalatePost,
    getPostApprovalStatus: handler.getPostApprovalStatus,
    recallPost: handler.recallPost,
    rejectPost: handler.rejectPost,
    submitPost: handler.submitPost,
  };
}
