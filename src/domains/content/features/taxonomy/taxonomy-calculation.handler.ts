/**
 * Computes the figures of a taxonomy, such as totals, taxes, and estimates.
 */

import * as contentTaxonomyCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { TaxonomyCalculationWorkflow } from "./taxonomy-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TaxonomyCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class TaxonomyCalculationHandler {
  constructor(@inject(TaxonomyCalculationWorkflow) private readonly workflow: TaxonomyCalculationWorkflow) {}

  /**
   * Calculates a taxonomy.
   */
  calculateTaxonomy = unary<contentTaxonomyCalculationServiceApi.CalculateTaxonomyRequest, contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse>(
    (request) => this.workflow.calculateTaxonomy(request),
  );

  /**
   * Compares a taxonomy.
   */
  compareTaxonomyOptions = (call: ServerUnaryCall<contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest, contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse>, done: sendUnaryData<contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse>): void => {
    void this.workflow.compareTaxonomyOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a taxonomy.
   */
  estimateTaxonomy = unary<contentTaxonomyCalculationServiceApi.EstimateTaxonomyRequest, contentTaxonomyCalculationServiceApi.EstimateTaxonomyResponse>(
    (request) => this.workflow.estimateTaxonomy(request),
  );

  /**
   * Explains a taxonomy.
   */
  explainTaxonomyCalculation = unary<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse>(
    (request) => this.workflow.explainTaxonomyCalculation(request),
  );

  /**
   * Returns a taxonomy.
   */
  getTaxonomyRates = (call: ServerUnaryCall<contentTaxonomyCalculationServiceApi.GetTaxonomyRatesRequest, contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse>, done: sendUnaryData<contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse>): void => {
    void this.workflow.getTaxonomyRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a taxonomy.
   */
  simulateTaxonomy = unary<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse>(
    (request) => this.workflow.simulateTaxonomy(request),
  );
}

export function implementation(handler: TaxonomyCalculationHandler): contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceServer {
  return {
    calculateTaxonomy: handler.calculateTaxonomy,
    compareTaxonomyOptions: handler.compareTaxonomyOptions,
    estimateTaxonomy: handler.estimateTaxonomy,
    explainTaxonomyCalculation: handler.explainTaxonomyCalculation,
    getTaxonomyRates: handler.getTaxonomyRates,
    simulateTaxonomy: handler.simulateTaxonomy,
  };
}
