/**
 * Computes the figures of an experiment, such as totals, taxes, and estimates.
 */

import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ExperimentCalculationWorkflow } from "../application/experiment-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentCalculationHandler {
  constructor(@inject(ExperimentCalculationWorkflow) private readonly workflow: ExperimentCalculationWorkflow) {}

  /**
   * Calculates an experiment.
   */
  calculateExperiment = (call: ServerUnaryCall<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>, done: sendUnaryData<experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>): void => {
    void this.workflow.calculateExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares an experiment.
   */
  compareExperimentOptions = unary<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse>(
    (request) => this.workflow.compareExperimentOptions(request),
  );

  /**
   * Estimates an experiment.
   */
  estimateExperiment = unary<experimentsExperimentCalculationServiceApi.EstimateExperimentRequest, experimentsExperimentCalculationServiceApi.EstimateExperimentResponse>(
    (request) => this.workflow.estimateExperiment(request),
  );

  /**
   * Explains an experiment.
   */
  explainExperimentCalculation = (call: ServerUnaryCall<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse>, done: sendUnaryData<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse>): void => {
    void this.workflow.explainExperimentCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an experiment.
   */
  getExperimentRates = unary<experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest, experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse>(
    (request) => this.workflow.getExperimentRates(request),
  );

  /**
   * Quotes an experiment.
   */
  quoteExperiment = unary<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse>(
    (request) => this.workflow.quoteExperiment(request),
  );

  /**
   * Recalculates an experiment.
   */
  recalculateExperiments = (call: ServerUnaryCall<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>, done: sendUnaryData<experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>): void => {
    void this.workflow.recalculateExperiments(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates an experiment.
   */
  simulateExperiment = unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse>(
    (request) => this.workflow.simulateExperiment(request),
  );
}

export function implementation(handler: ExperimentCalculationHandler): experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceServer {
  return {
    calculateExperiment: handler.calculateExperiment,
    compareExperimentOptions: handler.compareExperimentOptions,
    estimateExperiment: handler.estimateExperiment,
    explainExperimentCalculation: handler.explainExperimentCalculation,
    getExperimentRates: handler.getExperimentRates,
    quoteExperiment: handler.quoteExperiment,
    recalculateExperiments: handler.recalculateExperiments,
    simulateExperiment: handler.simulateExperiment,
  };
}
