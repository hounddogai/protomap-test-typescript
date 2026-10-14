/**
 * Computes the figures of an affinity, such as totals, taxes, and estimates.
 */

import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AffinityCalculationWorkflow } from "../application/affinity-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityCalculationHandler {
  constructor(@inject(AffinityCalculationWorkflow) private readonly workflow: AffinityCalculationWorkflow) {}

  /**
   * Calculates an affinity.
   */
  calculateAffinity = (call: ServerUnaryCall<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>, done: sendUnaryData<personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>): void => {
    void this.workflow.calculateAffinity(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares an affinity.
   */
  compareAffinityOptions = unary<personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest, personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse>(
    (request) => this.workflow.compareAffinityOptions(request),
  );

  /**
   * Estimates an affinity.
   */
  estimateAffinity = unary<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse>(
    (request) => this.workflow.estimateAffinity(request),
  );

  /**
   * Explains an affinity.
   */
  explainAffinityCalculation = (call: ServerUnaryCall<personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationRequest, personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse>, done: sendUnaryData<personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse>): void => {
    void this.workflow.explainAffinityCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an affinity.
   */
  getAffinityRates = unary<personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest, personalizationAffinityCalculationServiceApi.GetAffinityRatesResponse>(
    (request) => this.workflow.getAffinityRates(request),
  );

  /**
   * Quotes an affinity.
   */
  quoteAffinity = unary<personalizationAffinityCalculationServiceApi.QuoteAffinityRequest, personalizationAffinityCalculationServiceApi.QuoteAffinityResponse>(
    (request) => this.workflow.quoteAffinity(request),
  );

  /**
   * Simulates an affinity.
   */
  simulateAffinity = (call: ServerUnaryCall<personalizationAffinityCalculationServiceApi.SimulateAffinityRequest, personalizationAffinityCalculationServiceApi.SimulateAffinityResponse>, done: sendUnaryData<personalizationAffinityCalculationServiceApi.SimulateAffinityResponse>): void => {
    void this.workflow.simulateAffinity(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AffinityCalculationHandler): personalizationAffinityCalculationServiceApi.AffinityCalculationServiceServer {
  return {
    calculateAffinity: handler.calculateAffinity,
    compareAffinityOptions: handler.compareAffinityOptions,
    estimateAffinity: handler.estimateAffinity,
    explainAffinityCalculation: handler.explainAffinityCalculation,
    getAffinityRates: handler.getAffinityRates,
    quoteAffinity: handler.quoteAffinity,
    simulateAffinity: handler.simulateAffinity,
  };
}
