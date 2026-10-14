/**
 * Checks media assets against the rules before anything acts on them.
 */

import * as mediaMediaAssetValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { MediaAssetValidationWorkflow } from "./media-asset-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetValidationService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetValidationHandler {
  constructor(@inject(MediaAssetValidationWorkflow) private readonly workflow: MediaAssetValidationWorkflow) {}

  /**
   * Checks a media asset.
   */
  checkMediaAssetEligibility = unary<mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest, mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse>(
    (request) => this.workflow.checkMediaAssetEligibility(request),
  );

  /**
   * Explains a media asset.
   */
  explainMediaAssetDecision = (call: ServerUnaryCall<mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest, mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse>, done: sendUnaryData<mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse>): void => {
    void this.workflow.explainMediaAssetDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a media asset.
   */
  getMediaAssetRules = unary<mediaMediaAssetValidationServiceApi.GetMediaAssetRulesRequest, mediaMediaAssetValidationServiceApi.GetMediaAssetRulesResponse>(
    (request) => this.workflow.getMediaAssetRules(request),
  );

  /**
   * Lints a media asset.
   */
  lintMediaAssets = unary<mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest, mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse>(
    (request) => this.workflow.lintMediaAssets(request),
  );

  /**
   * Normalizes a media asset.
   */
  normalizeMediaAsset = (call: ServerUnaryCall<mediaMediaAssetValidationServiceApi.NormalizeMediaAssetRequest, mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse>): void => {
    void this.workflow.normalizeMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a media asset.
   */
  previewMediaAsset = unary<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse>(
    (request) => this.workflow.previewMediaAsset(request),
  );

  /**
   * Scores a media asset.
   */
  scoreMediaAsset = unary<mediaMediaAssetValidationServiceApi.ScoreMediaAssetRequest, mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse>(
    (request) => this.workflow.scoreMediaAsset(request),
  );

  /**
   * Validates a media asset.
   */
  validateMediaAsset = (call: ServerUnaryCall<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>): void => {
    void this.workflow.validateMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: MediaAssetValidationHandler): mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceServer {
  return {
    checkMediaAssetEligibility: handler.checkMediaAssetEligibility,
    explainMediaAssetDecision: handler.explainMediaAssetDecision,
    getMediaAssetRules: handler.getMediaAssetRules,
    lintMediaAssets: handler.lintMediaAssets,
    normalizeMediaAsset: handler.normalizeMediaAsset,
    previewMediaAsset: handler.previewMediaAsset,
    scoreMediaAsset: handler.scoreMediaAsset,
    validateMediaAsset: handler.validateMediaAsset,
  };
}
