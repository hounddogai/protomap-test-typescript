/**
 * Checks chat messages against the rules before anything acts on them.
 */

import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatMessageValidationWorkflow } from "../application/chat-message-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatMessageValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageValidationHandler {
  constructor(@inject(ChatMessageValidationWorkflow) private readonly workflow: ChatMessageValidationWorkflow) {}

  /**
   * Checks a chat message.
   */
  checkChatMessageEligibility = (call: ServerUnaryCall<messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityRequest, messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse>, done: sendUnaryData<messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse>): void => {
    void this.workflow.checkChatMessageEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a chat message.
   */
  explainChatMessageDecision = unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse>(
    (request) => this.workflow.explainChatMessageDecision(request),
  );

  /**
   * Lints a chat message.
   */
  lintChatMessages = unary<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse>(
    (request) => this.workflow.lintChatMessages(request),
  );

  /**
   * Previews a chat message.
   */
  previewChatMessage = (call: ServerUnaryCall<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>, done: sendUnaryData<messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>): void => {
    void this.workflow.previewChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a chat message.
   */
  scoreChatMessage = unary<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse>(
    (request) => this.workflow.scoreChatMessage(request),
  );

  /**
   * Validates a chat message.
   */
  validateChatMessage = unary<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>(
    (request) => this.workflow.validateChatMessage(request),
  );
}

export function implementation(handler: ChatMessageValidationHandler): messagingChatMessageValidationServiceApi.ChatMessageValidationServiceServer {
  return {
    checkChatMessageEligibility: handler.checkChatMessageEligibility,
    explainChatMessageDecision: handler.explainChatMessageDecision,
    lintChatMessages: handler.lintChatMessages,
    previewChatMessage: handler.previewChatMessage,
    scoreChatMessage: handler.scoreChatMessage,
    validateChatMessage: handler.validateChatMessage,
  };
}
