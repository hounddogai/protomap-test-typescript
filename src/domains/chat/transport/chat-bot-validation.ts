/**
 * Checks chat bots against the rules before anything acts on them.
 */

import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatBotValidationWorkflow } from "../application/chat-bot-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatBotValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotValidationHandler {
  constructor(@inject(ChatBotValidationWorkflow) private readonly workflow: ChatBotValidationWorkflow) {}

  /**
   * Checks a chat bot.
   */
  checkChatBotEligibility = (call: ServerUnaryCall<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>, done: sendUnaryData<chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>): void => {
    void this.workflow.checkChatBotEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a chat bot.
   */
  explainChatBotDecision = unary<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse>(
    (request) => this.workflow.explainChatBotDecision(request),
  );

  /**
   * Returns a chat bot.
   */
  getChatBotRules = unary<chatChatBotValidationServiceApi.GetChatBotRulesRequest, chatChatBotValidationServiceApi.GetChatBotRulesResponse>(
    (request) => this.workflow.getChatBotRules(request),
  );

  /**
   * Lints a chat bot.
   */
  lintChatBots = (call: ServerUnaryCall<chatChatBotValidationServiceApi.LintChatBotsRequest, chatChatBotValidationServiceApi.LintChatBotsResponse>, done: sendUnaryData<chatChatBotValidationServiceApi.LintChatBotsResponse>): void => {
    void this.workflow.lintChatBots(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a chat bot.
   */
  normalizeChatBot = unary<chatChatBotValidationServiceApi.NormalizeChatBotRequest, chatChatBotValidationServiceApi.NormalizeChatBotResponse>(
    (request) => this.workflow.normalizeChatBot(request),
  );

  /**
   * Previews a chat bot.
   */
  previewChatBot = unary<chatChatBotValidationServiceApi.PreviewChatBotRequest, chatChatBotValidationServiceApi.PreviewChatBotResponse>(
    (request) => this.workflow.previewChatBot(request),
  );

  /**
   * Scores a chat bot.
   */
  scoreChatBot = (call: ServerUnaryCall<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse>, done: sendUnaryData<chatChatBotValidationServiceApi.ScoreChatBotResponse>): void => {
    void this.workflow.scoreChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a chat bot.
   */
  validateChatBot = unary<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse>(
    (request) => this.workflow.validateChatBot(request),
  );
}

export function implementation(handler: ChatBotValidationHandler): chatChatBotValidationServiceApi.ChatBotValidationServiceServer {
  return {
    checkChatBotEligibility: handler.checkChatBotEligibility,
    explainChatBotDecision: handler.explainChatBotDecision,
    getChatBotRules: handler.getChatBotRules,
    lintChatBots: handler.lintChatBots,
    normalizeChatBot: handler.normalizeChatBot,
    previewChatBot: handler.previewChatBot,
    scoreChatBot: handler.scoreChatBot,
    validateChatBot: handler.validateChatBot,
  };
}
