/**
 * Routes content revisions through approval, with escalation and delegation.
 */

import * as contentContentRevisionApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ContentRevisionApprovalWorkflow } from "../application/content-revision-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentRevisionApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ContentRevisionApprovalHandler {
  constructor(@inject(ContentRevisionApprovalWorkflow) private readonly workflow: ContentRevisionApprovalWorkflow) {}

  /**
   * Approves a content revision.
   */
  approveContentRevision = (call: ServerUnaryCall<contentContentRevisionApprovalServiceApi.ApproveContentRevisionRequest, contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse>, done: sendUnaryData<contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse>): void => {
    void this.workflow.approveContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a content revision.
   */
  commentContentRevisionApproval = unary<contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalRequest, contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalResponse>(
    (request) => this.workflow.commentContentRevisionApproval(request),
  );

  /**
   * Delegates a content revision.
   */
  delegateContentRevisionApproval = unary<contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest, contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse>(
    (request) => this.workflow.delegateContentRevisionApproval(request),
  );

  /**
   * Escalates a content revision.
   */
  escalateContentRevision = (call: ServerUnaryCall<contentContentRevisionApprovalServiceApi.EscalateContentRevisionRequest, contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse>, done: sendUnaryData<contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse>): void => {
    void this.workflow.escalateContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a content revision.
   */
  getContentRevisionApprovalStatus = unary<contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusRequest, contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusResponse>(
    (request) => this.workflow.getContentRevisionApprovalStatus(request),
  );

  /**
   * Lists content revisions a page at a time.
   */
  listPendingContentRevisions = unary<contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsRequest, contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsResponse>(
    (request) => this.workflow.listPendingContentRevisions(request),
  );

  /**
   * Recalls a content revision.
   */
  recallContentRevision = (call: ServerUnaryCall<contentContentRevisionApprovalServiceApi.RecallContentRevisionRequest, contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse>, done: sendUnaryData<contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse>): void => {
    void this.workflow.recallContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a content revision.
   */
  rejectContentRevision = unary<contentContentRevisionApprovalServiceApi.RejectContentRevisionRequest, contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse>(
    (request) => this.workflow.rejectContentRevision(request),
  );

  /**
   * Submits a content revision.
   */
  submitContentRevision = unary<contentContentRevisionApprovalServiceApi.SubmitContentRevisionRequest, contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse>(
    (request) => this.workflow.submitContentRevision(request),
  );
}

export function implementation(handler: ContentRevisionApprovalHandler): contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceServer {
  return {
    approveContentRevision: handler.approveContentRevision,
    commentContentRevisionApproval: handler.commentContentRevisionApproval,
    delegateContentRevisionApproval: handler.delegateContentRevisionApproval,
    escalateContentRevision: handler.escalateContentRevision,
    getContentRevisionApprovalStatus: handler.getContentRevisionApprovalStatus,
    listPendingContentRevisions: handler.listPendingContentRevisions,
    recallContentRevision: handler.recallContentRevision,
    rejectContentRevision: handler.rejectContentRevision,
    submitContentRevision: handler.submitContentRevision,
  };
}
