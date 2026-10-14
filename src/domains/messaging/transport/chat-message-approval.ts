/**
 * Routes chat messages through approval, with escalation and delegation.
 */

import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatMessageApprovalWorkflow } from "../application/chat-message-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatMessageApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageApprovalHandler {
  constructor(@inject(ChatMessageApprovalWorkflow) private readonly workflow: ChatMessageApprovalWorkflow) {}

  /**
   * Approves a chat message.
   */
  approveChatMessage = (call: ServerUnaryCall<messagingChatMessageApprovalServiceApi.ApproveChatMessageRequest, messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse>, done: sendUnaryData<messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse>): void => {
    void this.workflow.approveChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a chat message.
   */
  commentChatMessageApproval = unary<messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse>(
    (request) => this.workflow.commentChatMessageApproval(request),
  );

  /**
   * Delegates a chat message.
   */
  delegateChatMessageApproval = unary<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse>(
    (request) => this.workflow.delegateChatMessageApproval(request),
  );

  /**
   * Lists chat messages a page at a time.
   */
  listPendingChatMessages = (call: ServerUnaryCall<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse>, done: sendUnaryData<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse>): void => {
    void this.workflow.listPendingChatMessages(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a chat message.
   */
  rejectChatMessage = unary<messagingChatMessageApprovalServiceApi.RejectChatMessageRequest, messagingChatMessageApprovalServiceApi.RejectChatMessageResponse>(
    (request) => this.workflow.rejectChatMessage(request),
  );

  /**
   * Submits a chat message.
   */
  submitChatMessage = unary<messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest, messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse>(
    (request) => this.workflow.submitChatMessage(request),
  );
}

export function implementation(handler: ChatMessageApprovalHandler): messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceServer {
  return {
    approveChatMessage: handler.approveChatMessage,
    commentChatMessageApproval: handler.commentChatMessageApproval,
    delegateChatMessageApproval: handler.delegateChatMessageApproval,
    listPendingChatMessages: handler.listPendingChatMessages,
    rejectChatMessage: handler.rejectChatMessage,
    submitChatMessage: handler.submitChatMessage,
  };
}
