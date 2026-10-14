/**
 * Computes the figures of a media asset, such as totals, taxes, and estimates.
 */

import * as mediaMediaAssetCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { MediaAssetCalculationWorkflow } from "./media-asset-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetCalculationHandler {
  constructor(@inject(MediaAssetCalculationWorkflow) private readonly workflow: MediaAssetCalculationWorkflow) {}

  /**
   * Calculates a media asset.
   */
  calculateMediaAsset = unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse>(
    (request) => this.workflow.calculateMediaAsset(request),
  );

  /**
   * Compares a media asset.
   */
  compareMediaAssetOptions = (call: ServerUnaryCall<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>, done: sendUnaryData<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>): void => {
    void this.workflow.compareMediaAssetOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a media asset.
   */
  estimateMediaAsset = unary<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse>(
    (request) => this.workflow.estimateMediaAsset(request),
  );

  /**
   * Explains a media asset.
   */
  explainMediaAssetCalculation = unary<mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationRequest, mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse>(
    (request) => this.workflow.explainMediaAssetCalculation(request),
  );

  /**
   * Returns a media asset.
   */
  getMediaAssetRates = (call: ServerUnaryCall<mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesRequest, mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesResponse>, done: sendUnaryData<mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesResponse>): void => {
    void this.workflow.getMediaAssetRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a media asset.
   */
  quoteMediaAsset = unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(
    (request) => this.workflow.quoteMediaAsset(request),
  );

  /**
   * Recalculates a media asset.
   */
  recalculateMediaAssets = unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(
    (request) => this.workflow.recalculateMediaAssets(request),
  );

  /**
   * Simulates a media asset.
   */
  simulateMediaAsset = (call: ServerUnaryCall<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>): void => {
    void this.workflow.simulateMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: MediaAssetCalculationHandler): mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceServer {
  return {
    calculateMediaAsset: handler.calculateMediaAsset,
    compareMediaAssetOptions: handler.compareMediaAssetOptions,
    estimateMediaAsset: handler.estimateMediaAsset,
    explainMediaAssetCalculation: handler.explainMediaAssetCalculation,
    getMediaAssetRates: handler.getMediaAssetRates,
    quoteMediaAsset: handler.quoteMediaAsset,
    recalculateMediaAssets: handler.recalculateMediaAssets,
    simulateMediaAsset: handler.simulateMediaAsset,
  };
}
