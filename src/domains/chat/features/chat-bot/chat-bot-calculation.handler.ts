/**
 * Computes the figures of a chat bot, such as totals, taxes, and estimates.
 */

import * as chatChatBotCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChatBotCalculationWorkflow } from "./chat-bot-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatBotCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotCalculationHandler {
  constructor(@inject(ChatBotCalculationWorkflow) private readonly workflow: ChatBotCalculationWorkflow) {}

  /**
   * Calculates a chat bot.
   */
  calculateChatBot = unary<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse>(
    (request) => this.workflow.calculateChatBot(request),
  );

  /**
   * Compares a chat bot.
   */
  compareChatBotOptions = (call: ServerUnaryCall<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>, done: sendUnaryData<chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>): void => {
    void this.workflow.compareChatBotOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a chat bot.
   */
  estimateChatBot = unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(
    (request) => this.workflow.estimateChatBot(request),
  );

  /**
   * Explains a chat bot.
   */
  explainChatBotCalculation = unary<chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest, chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse>(
    (request) => this.workflow.explainChatBotCalculation(request),
  );

  /**
   * Returns a chat bot.
   */
  getChatBotRates = (call: ServerUnaryCall<chatChatBotCalculationServiceApi.GetChatBotRatesRequest, chatChatBotCalculationServiceApi.GetChatBotRatesResponse>, done: sendUnaryData<chatChatBotCalculationServiceApi.GetChatBotRatesResponse>): void => {
    void this.workflow.getChatBotRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a chat bot.
   */
  quoteChatBot = unary<chatChatBotCalculationServiceApi.QuoteChatBotRequest, chatChatBotCalculationServiceApi.QuoteChatBotResponse>(
    (request) => this.workflow.quoteChatBot(request),
  );

  /**
   * Recalculates a chat bot.
   */
  recalculateChatBots = unary<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse>(
    (request) => this.workflow.recalculateChatBots(request),
  );

  /**
   * Simulates a chat bot.
   */
  simulateChatBot = (call: ServerUnaryCall<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse>, done: sendUnaryData<chatChatBotCalculationServiceApi.SimulateChatBotResponse>): void => {
    void this.workflow.simulateChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ChatBotCalculationHandler): chatChatBotCalculationServiceApi.ChatBotCalculationServiceServer {
  return {
    calculateChatBot: handler.calculateChatBot,
    compareChatBotOptions: handler.compareChatBotOptions,
    estimateChatBot: handler.estimateChatBot,
    explainChatBotCalculation: handler.explainChatBotCalculation,
    getChatBotRates: handler.getChatBotRates,
    quoteChatBot: handler.quoteChatBot,
    recalculateChatBots: handler.recalculateChatBots,
    simulateChatBot: handler.simulateChatBot,
  };
}
