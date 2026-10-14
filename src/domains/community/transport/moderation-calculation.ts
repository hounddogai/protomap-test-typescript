/**
 * Computes the figures of a moderation, such as totals, taxes, and estimates.
 */

import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ModerationCalculationWorkflow } from "../application/moderation-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ModerationCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ModerationCalculationHandler {
  constructor(@inject(ModerationCalculationWorkflow) private readonly workflow: ModerationCalculationWorkflow) {}

  /**
   * Calculates a moderation.
   */
  calculateModeration = (call: ServerUnaryCall<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse>, done: sendUnaryData<communityModerationCalculationServiceApi.CalculateModerationResponse>): void => {
    void this.workflow.calculateModeration(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a moderation.
   */
  compareModerationOptions = unary<communityModerationCalculationServiceApi.CompareModerationOptionsRequest, communityModerationCalculationServiceApi.CompareModerationOptionsResponse>(
    (request) => this.workflow.compareModerationOptions(request),
  );

  /**
   * Estimates a moderation.
   */
  estimateModeration = unary<communityModerationCalculationServiceApi.EstimateModerationRequest, communityModerationCalculationServiceApi.EstimateModerationResponse>(
    (request) => this.workflow.estimateModeration(request),
  );

  /**
   * Explains a moderation.
   */
  explainModerationCalculation = (call: ServerUnaryCall<communityModerationCalculationServiceApi.ExplainModerationCalculationRequest, communityModerationCalculationServiceApi.ExplainModerationCalculationResponse>, done: sendUnaryData<communityModerationCalculationServiceApi.ExplainModerationCalculationResponse>): void => {
    void this.workflow.explainModerationCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a moderation.
   */
  getModerationRates = unary<communityModerationCalculationServiceApi.GetModerationRatesRequest, communityModerationCalculationServiceApi.GetModerationRatesResponse>(
    (request) => this.workflow.getModerationRates(request),
  );

  /**
   * Quotes a moderation.
   */
  quoteModeration = unary<communityModerationCalculationServiceApi.QuoteModerationRequest, communityModerationCalculationServiceApi.QuoteModerationResponse>(
    (request) => this.workflow.quoteModeration(request),
  );

  /**
   * Recalculates a moderation.
   */
  recalculateModerations = (call: ServerUnaryCall<communityModerationCalculationServiceApi.RecalculateModerationsRequest, communityModerationCalculationServiceApi.RecalculateModerationsResponse>, done: sendUnaryData<communityModerationCalculationServiceApi.RecalculateModerationsResponse>): void => {
    void this.workflow.recalculateModerations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a moderation.
   */
  simulateModeration = unary<communityModerationCalculationServiceApi.SimulateModerationRequest, communityModerationCalculationServiceApi.SimulateModerationResponse>(
    (request) => this.workflow.simulateModeration(request),
  );
}

export function implementation(handler: ModerationCalculationHandler): communityModerationCalculationServiceApi.ModerationCalculationServiceServer {
  return {
    calculateModeration: handler.calculateModeration,
    compareModerationOptions: handler.compareModerationOptions,
    estimateModeration: handler.estimateModeration,
    explainModerationCalculation: handler.explainModerationCalculation,
    getModerationRates: handler.getModerationRates,
    quoteModeration: handler.quoteModeration,
    recalculateModerations: handler.recalculateModerations,
    simulateModeration: handler.simulateModeration,
  };
}
