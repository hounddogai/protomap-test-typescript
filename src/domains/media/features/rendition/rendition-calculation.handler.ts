/**
 * Computes the figures of a rendition, such as totals, taxes, and estimates.
 */

import * as mediaRenditionCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { RenditionCalculationWorkflow } from "./rendition-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RenditionCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionCalculationHandler {
  constructor(@inject(RenditionCalculationWorkflow) private readonly workflow: RenditionCalculationWorkflow) {}

  /**
   * Calculates a rendition.
   */
  calculateRendition = unary<mediaRenditionCalculationServiceApi.CalculateRenditionRequest, mediaRenditionCalculationServiceApi.CalculateRenditionResponse>(
    (request) => this.workflow.calculateRendition(request),
  );

  /**
   * Compares a rendition.
   */
  compareRenditionOptions = (call: ServerUnaryCall<mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest, mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse>, done: sendUnaryData<mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse>): void => {
    void this.workflow.compareRenditionOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a rendition.
   */
  estimateRendition = unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse>(
    (request) => this.workflow.estimateRendition(request),
  );

  /**
   * Explains a rendition.
   */
  explainRenditionCalculation = unary<mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest, mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse>(
    (request) => this.workflow.explainRenditionCalculation(request),
  );

  /**
   * Returns a rendition.
   */
  getRenditionRates = (call: ServerUnaryCall<mediaRenditionCalculationServiceApi.GetRenditionRatesRequest, mediaRenditionCalculationServiceApi.GetRenditionRatesResponse>, done: sendUnaryData<mediaRenditionCalculationServiceApi.GetRenditionRatesResponse>): void => {
    void this.workflow.getRenditionRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a rendition.
   */
  quoteRendition = unary<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>(
    (request) => this.workflow.quoteRendition(request),
  );

  /**
   * Recalculates a rendition.
   */
  recalculateRenditions = unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(
    (request) => this.workflow.recalculateRenditions(request),
  );

  /**
   * Simulates a rendition.
   */
  simulateRendition = (call: ServerUnaryCall<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse>, done: sendUnaryData<mediaRenditionCalculationServiceApi.SimulateRenditionResponse>): void => {
    void this.workflow.simulateRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: RenditionCalculationHandler): mediaRenditionCalculationServiceApi.RenditionCalculationServiceServer {
  return {
    calculateRendition: handler.calculateRendition,
    compareRenditionOptions: handler.compareRenditionOptions,
    estimateRendition: handler.estimateRendition,
    explainRenditionCalculation: handler.explainRenditionCalculation,
    getRenditionRates: handler.getRenditionRates,
    quoteRendition: handler.quoteRendition,
    recalculateRenditions: handler.recalculateRenditions,
    simulateRendition: handler.simulateRendition,
  };
}
