/**
 * Computes the figures of a content block, such as totals, taxes, and estimates.
 */

import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ContentBlockCalculationWorkflow } from "./content-block-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentBlockCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ContentBlockCalculationHandler {
  constructor(@inject(ContentBlockCalculationWorkflow) private readonly workflow: ContentBlockCalculationWorkflow) {}

  /**
   * Calculates a content block.
   */
  calculateContentBlock = unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>(
    (request) => this.workflow.calculateContentBlock(request),
  );

  /**
   * Compares a content block.
   */
  compareContentBlockOptions = (call: ServerUnaryCall<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>, done: sendUnaryData<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>): void => {
    void this.workflow.compareContentBlockOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a content block.
   */
  estimateContentBlock = unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(
    (request) => this.workflow.estimateContentBlock(request),
  );

  /**
   * Explains a content block.
   */
  explainContentBlockCalculation = unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(
    (request) => this.workflow.explainContentBlockCalculation(request),
  );

  /**
   * Returns a content block.
   */
  getContentBlockRates = (call: ServerUnaryCall<contentContentBlockCalculationServiceApi.GetContentBlockRatesRequest, contentContentBlockCalculationServiceApi.GetContentBlockRatesResponse>, done: sendUnaryData<contentContentBlockCalculationServiceApi.GetContentBlockRatesResponse>): void => {
    void this.workflow.getContentBlockRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a content block.
   */
  quoteContentBlock = unary<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse>(
    (request) => this.workflow.quoteContentBlock(request),
  );

  /**
   * Recalculates a content block.
   */
  recalculateContentBlocks = unary<contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest, contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse>(
    (request) => this.workflow.recalculateContentBlocks(request),
  );

  /**
   * Simulates a content block.
   */
  simulateContentBlock = (call: ServerUnaryCall<contentContentBlockCalculationServiceApi.SimulateContentBlockRequest, contentContentBlockCalculationServiceApi.SimulateContentBlockResponse>, done: sendUnaryData<contentContentBlockCalculationServiceApi.SimulateContentBlockResponse>): void => {
    void this.workflow.simulateContentBlock(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ContentBlockCalculationHandler): contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceServer {
  return {
    calculateContentBlock: handler.calculateContentBlock,
    compareContentBlockOptions: handler.compareContentBlockOptions,
    estimateContentBlock: handler.estimateContentBlock,
    explainContentBlockCalculation: handler.explainContentBlockCalculation,
    getContentBlockRates: handler.getContentBlockRates,
    quoteContentBlock: handler.quoteContentBlock,
    recalculateContentBlocks: handler.recalculateContentBlocks,
    simulateContentBlock: handler.simulateContentBlock,
  };
}
