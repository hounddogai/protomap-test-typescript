/**
 * Computes the figures of a badge, such as totals, taxes, and estimates.
 */

import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { BadgeCalculationWorkflow } from "./badge-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for BadgeCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class BadgeCalculationHandler {
  constructor(@inject(BadgeCalculationWorkflow) private readonly workflow: BadgeCalculationWorkflow) {}

  /**
   * Calculates a badge.
   */
  calculateBadge = unary<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(
    (request) => this.workflow.calculateBadge(request),
  );

  /**
   * Estimates a badge.
   */
  estimateBadge = (call: ServerUnaryCall<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse>, done: sendUnaryData<communityBadgeCalculationServiceApi.EstimateBadgeResponse>): void => {
    void this.workflow.estimateBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a badge.
   */
  explainBadgeCalculation = unary<communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest, communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse>(
    (request) => this.workflow.explainBadgeCalculation(request),
  );

  /**
   * Returns a badge.
   */
  getBadgeRates = unary<communityBadgeCalculationServiceApi.GetBadgeRatesRequest, communityBadgeCalculationServiceApi.GetBadgeRatesResponse>(
    (request) => this.workflow.getBadgeRates(request),
  );

  /**
   * Quotes a badge.
   */
  quoteBadge = (call: ServerUnaryCall<communityBadgeCalculationServiceApi.QuoteBadgeRequest, communityBadgeCalculationServiceApi.QuoteBadgeResponse>, done: sendUnaryData<communityBadgeCalculationServiceApi.QuoteBadgeResponse>): void => {
    void this.workflow.quoteBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a badge.
   */
  recalculateBadges = unary<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>(
    (request) => this.workflow.recalculateBadges(request),
  );

  /**
   * Simulates a badge.
   */
  simulateBadge = unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(
    (request) => this.workflow.simulateBadge(request),
  );
}

export function implementation(handler: BadgeCalculationHandler): communityBadgeCalculationServiceApi.BadgeCalculationServiceServer {
  return {
    calculateBadge: handler.calculateBadge,
    estimateBadge: handler.estimateBadge,
    explainBadgeCalculation: handler.explainBadgeCalculation,
    getBadgeRates: handler.getBadgeRates,
    quoteBadge: handler.quoteBadge,
    recalculateBadges: handler.recalculateBadges,
    simulateBadge: handler.simulateBadge,
  };
}
