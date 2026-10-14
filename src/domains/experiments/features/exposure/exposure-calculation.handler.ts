/**
 * Computes the figures of an exposure, such as totals, taxes, and estimates.
 */

import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ExposureCalculationWorkflow } from "./exposure-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExposureCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureCalculationHandler {
  constructor(@inject(ExposureCalculationWorkflow) private readonly workflow: ExposureCalculationWorkflow) {}

  /**
   * Calculates an exposure.
   */
  calculateExposure = unary<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse>(
    (request) => this.workflow.calculateExposure(request),
  );

  /**
   * Compares an exposure.
   */
  compareExposureOptions = (call: ServerUnaryCall<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>, done: sendUnaryData<experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>): void => {
    void this.workflow.compareExposureOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates an exposure.
   */
  estimateExposure = unary<experimentsExposureCalculationServiceApi.EstimateExposureRequest, experimentsExposureCalculationServiceApi.EstimateExposureResponse>(
    (request) => this.workflow.estimateExposure(request),
  );

  /**
   * Explains an exposure.
   */
  explainExposureCalculation = unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(
    (request) => this.workflow.explainExposureCalculation(request),
  );

  /**
   * Quotes an exposure.
   */
  quoteExposure = (call: ServerUnaryCall<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse>, done: sendUnaryData<experimentsExposureCalculationServiceApi.QuoteExposureResponse>): void => {
    void this.workflow.quoteExposure(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates an exposure.
   */
  recalculateExposures = unary<experimentsExposureCalculationServiceApi.RecalculateExposuresRequest, experimentsExposureCalculationServiceApi.RecalculateExposuresResponse>(
    (request) => this.workflow.recalculateExposures(request),
  );

  /**
   * Simulates an exposure.
   */
  simulateExposure = unary<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(
    (request) => this.workflow.simulateExposure(request),
  );
}

export function implementation(handler: ExposureCalculationHandler): experimentsExposureCalculationServiceApi.ExposureCalculationServiceServer {
  return {
    calculateExposure: handler.calculateExposure,
    compareExposureOptions: handler.compareExposureOptions,
    estimateExposure: handler.estimateExposure,
    explainExposureCalculation: handler.explainExposureCalculation,
    quoteExposure: handler.quoteExposure,
    recalculateExposures: handler.recalculateExposures,
    simulateExposure: handler.simulateExposure,
  };
}
