/**
 * Checks conversations against the rules before anything acts on them.
 */

import * as messagingConversationValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ConversationValidationWorkflow } from "./conversation-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationValidationHandler {
  constructor(@inject(ConversationValidationWorkflow) private readonly workflow: ConversationValidationWorkflow) {}

  /**
   * Checks a conversation.
   */
  checkConversationEligibility = unary<messagingConversationValidationServiceApi.CheckConversationEligibilityRequest, messagingConversationValidationServiceApi.CheckConversationEligibilityResponse>(
    (request) => this.workflow.checkConversationEligibility(request),
  );

  /**
   * Explains a conversation.
   */
  explainConversationDecision = (call: ServerUnaryCall<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse>, done: sendUnaryData<messagingConversationValidationServiceApi.ExplainConversationDecisionResponse>): void => {
    void this.workflow.explainConversationDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a conversation.
   */
  getConversationRules = unary<messagingConversationValidationServiceApi.GetConversationRulesRequest, messagingConversationValidationServiceApi.GetConversationRulesResponse>(
    (request) => this.workflow.getConversationRules(request),
  );

  /**
   * Lints a conversation.
   */
  lintConversations = unary<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse>(
    (request) => this.workflow.lintConversations(request),
  );

  /**
   * Normalizes a conversation.
   */
  normalizeConversation = (call: ServerUnaryCall<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse>, done: sendUnaryData<messagingConversationValidationServiceApi.NormalizeConversationResponse>): void => {
    void this.workflow.normalizeConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a conversation.
   */
  previewConversation = unary<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse>(
    (request) => this.workflow.previewConversation(request),
  );

  /**
   * Scores a conversation.
   */
  scoreConversation = unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(
    (request) => this.workflow.scoreConversation(request),
  );

  /**
   * Validates a conversation.
   */
  validateConversation = (call: ServerUnaryCall<messagingConversationValidationServiceApi.ValidateConversationRequest, messagingConversationValidationServiceApi.ValidateConversationResponse>, done: sendUnaryData<messagingConversationValidationServiceApi.ValidateConversationResponse>): void => {
    void this.workflow.validateConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ConversationValidationHandler): messagingConversationValidationServiceApi.ConversationValidationServiceServer {
  return {
    checkConversationEligibility: handler.checkConversationEligibility,
    explainConversationDecision: handler.explainConversationDecision,
    getConversationRules: handler.getConversationRules,
    lintConversations: handler.lintConversations,
    normalizeConversation: handler.normalizeConversation,
    previewConversation: handler.previewConversation,
    scoreConversation: handler.scoreConversation,
    validateConversation: handler.validateConversation,
  };
}
