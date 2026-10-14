/**
 * Computes the figures of a conversation, such as totals, taxes, and estimates.
 */

import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ConversationCalculationWorkflow } from "../application/conversation-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationCalculationHandler {
  constructor(@inject(ConversationCalculationWorkflow) private readonly workflow: ConversationCalculationWorkflow) {}

  /**
   * Calculates a conversation.
   */
  calculateConversation = (call: ServerUnaryCall<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse>, done: sendUnaryData<messagingConversationCalculationServiceApi.CalculateConversationResponse>): void => {
    void this.workflow.calculateConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a conversation.
   */
  compareConversationOptions = unary<messagingConversationCalculationServiceApi.CompareConversationOptionsRequest, messagingConversationCalculationServiceApi.CompareConversationOptionsResponse>(
    (request) => this.workflow.compareConversationOptions(request),
  );

  /**
   * Estimates a conversation.
   */
  estimateConversation = unary<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse>(
    (request) => this.workflow.estimateConversation(request),
  );

  /**
   * Explains a conversation.
   */
  explainConversationCalculation = (call: ServerUnaryCall<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse>, done: sendUnaryData<messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse>): void => {
    void this.workflow.explainConversationCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a conversation.
   */
  getConversationRates = unary<messagingConversationCalculationServiceApi.GetConversationRatesRequest, messagingConversationCalculationServiceApi.GetConversationRatesResponse>(
    (request) => this.workflow.getConversationRates(request),
  );

  /**
   * Quotes a conversation.
   */
  quoteConversation = unary<messagingConversationCalculationServiceApi.QuoteConversationRequest, messagingConversationCalculationServiceApi.QuoteConversationResponse>(
    (request) => this.workflow.quoteConversation(request),
  );

  /**
   * Recalculates a conversation.
   */
  recalculateConversations = (call: ServerUnaryCall<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse>, done: sendUnaryData<messagingConversationCalculationServiceApi.RecalculateConversationsResponse>): void => {
    void this.workflow.recalculateConversations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a conversation.
   */
  simulateConversation = unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(
    (request) => this.workflow.simulateConversation(request),
  );
}

export function implementation(handler: ConversationCalculationHandler): messagingConversationCalculationServiceApi.ConversationCalculationServiceServer {
  return {
    calculateConversation: handler.calculateConversation,
    compareConversationOptions: handler.compareConversationOptions,
    estimateConversation: handler.estimateConversation,
    explainConversationCalculation: handler.explainConversationCalculation,
    getConversationRates: handler.getConversationRates,
    quoteConversation: handler.quoteConversation,
    recalculateConversations: handler.recalculateConversations,
    simulateConversation: handler.simulateConversation,
  };
}
