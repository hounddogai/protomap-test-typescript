/**
 * Routes handoffs through approval, with escalation and delegation.
 */

import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { HandoffApprovalWorkflow } from "../application/handoff-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for HandoffApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffApprovalHandler {
  constructor(@inject(HandoffApprovalWorkflow) private readonly workflow: HandoffApprovalWorkflow) {}

  /**
   * Approves a handoff.
   */
  approveHandoff = (call: ServerUnaryCall<chatHandoffApprovalServiceApi.ApproveHandoffRequest, chatHandoffApprovalServiceApi.ApproveHandoffResponse>, done: sendUnaryData<chatHandoffApprovalServiceApi.ApproveHandoffResponse>): void => {
    void this.workflow.approveHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a handoff.
   */
  commentHandoffApproval = unary<chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest, chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse>(
    (request) => this.workflow.commentHandoffApproval(request),
  );

  /**
   * Escalates a handoff.
   */
  escalateHandoff = unary<chatHandoffApprovalServiceApi.EscalateHandoffRequest, chatHandoffApprovalServiceApi.EscalateHandoffResponse>(
    (request) => this.workflow.escalateHandoff(request),
  );

  /**
   * Lists handoffs a page at a time.
   */
  listPendingHandoffs = (call: ServerUnaryCall<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>, done: sendUnaryData<chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>): void => {
    void this.workflow.listPendingHandoffs(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a handoff.
   */
  recallHandoff = unary<chatHandoffApprovalServiceApi.RecallHandoffRequest, chatHandoffApprovalServiceApi.RecallHandoffResponse>(
    (request) => this.workflow.recallHandoff(request),
  );

  /**
   * Rejects a handoff.
   */
  rejectHandoff = unary<chatHandoffApprovalServiceApi.RejectHandoffRequest, chatHandoffApprovalServiceApi.RejectHandoffResponse>(
    (request) => this.workflow.rejectHandoff(request),
  );

  /**
   * Submits a handoff.
   */
  submitHandoff = (call: ServerUnaryCall<chatHandoffApprovalServiceApi.SubmitHandoffRequest, chatHandoffApprovalServiceApi.SubmitHandoffResponse>, done: sendUnaryData<chatHandoffApprovalServiceApi.SubmitHandoffResponse>): void => {
    void this.workflow.submitHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: HandoffApprovalHandler): chatHandoffApprovalServiceApi.HandoffApprovalServiceServer {
  return {
    approveHandoff: handler.approveHandoff,
    commentHandoffApproval: handler.commentHandoffApproval,
    escalateHandoff: handler.escalateHandoff,
    listPendingHandoffs: handler.listPendingHandoffs,
    recallHandoff: handler.recallHandoff,
    rejectHandoff: handler.rejectHandoff,
    submitHandoff: handler.submitHandoff,
  };
}
