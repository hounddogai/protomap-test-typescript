/**
 * Routes conversations through approval, with escalation and delegation.
 */

import * as messagingConversationApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ConversationApprovalWorkflow } from "./conversation-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationApprovalHandler {
  constructor(@inject(ConversationApprovalWorkflow) private readonly workflow: ConversationApprovalWorkflow) {}

  /**
   * Approves a conversation.
   */
  approveConversation = unary<messagingConversationApprovalServiceApi.ApproveConversationRequest, messagingConversationApprovalServiceApi.ApproveConversationResponse>(
    (request) => this.workflow.approveConversation(request),
  );

  /**
   * Comments a conversation.
   */
  commentConversationApproval = (call: ServerUnaryCall<messagingConversationApprovalServiceApi.CommentConversationApprovalRequest, messagingConversationApprovalServiceApi.CommentConversationApprovalResponse>, done: sendUnaryData<messagingConversationApprovalServiceApi.CommentConversationApprovalResponse>): void => {
    void this.workflow.commentConversationApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a conversation.
   */
  delegateConversationApproval = unary<messagingConversationApprovalServiceApi.DelegateConversationApprovalRequest, messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse>(
    (request) => this.workflow.delegateConversationApproval(request),
  );

  /**
   * Escalates a conversation.
   */
  escalateConversation = unary<messagingConversationApprovalServiceApi.EscalateConversationRequest, messagingConversationApprovalServiceApi.EscalateConversationResponse>(
    (request) => this.workflow.escalateConversation(request),
  );

  /**
   * Returns a conversation.
   */
  getConversationApprovalStatus = (call: ServerUnaryCall<messagingConversationApprovalServiceApi.GetConversationApprovalStatusRequest, messagingConversationApprovalServiceApi.GetConversationApprovalStatusResponse>, done: sendUnaryData<messagingConversationApprovalServiceApi.GetConversationApprovalStatusResponse>): void => {
    void this.workflow.getConversationApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists conversations a page at a time.
   */
  listPendingConversations = unary<messagingConversationApprovalServiceApi.ListPendingConversationsRequest, messagingConversationApprovalServiceApi.ListPendingConversationsResponse>(
    (request) => this.workflow.listPendingConversations(request),
  );

  /**
   * Recalls a conversation.
   */
  recallConversation = unary<messagingConversationApprovalServiceApi.RecallConversationRequest, messagingConversationApprovalServiceApi.RecallConversationResponse>(
    (request) => this.workflow.recallConversation(request),
  );

  /**
   * Submits a conversation.
   */
  submitConversation = (call: ServerUnaryCall<messagingConversationApprovalServiceApi.SubmitConversationRequest, messagingConversationApprovalServiceApi.SubmitConversationResponse>, done: sendUnaryData<messagingConversationApprovalServiceApi.SubmitConversationResponse>): void => {
    void this.workflow.submitConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ConversationApprovalHandler): messagingConversationApprovalServiceApi.ConversationApprovalServiceServer {
  return {
    approveConversation: handler.approveConversation,
    commentConversationApproval: handler.commentConversationApproval,
    delegateConversationApproval: handler.delegateConversationApproval,
    escalateConversation: handler.escalateConversation,
    getConversationApprovalStatus: handler.getConversationApprovalStatus,
    listPendingConversations: handler.listPendingConversations,
    recallConversation: handler.recallConversation,
    submitConversation: handler.submitConversation,
  };
}
