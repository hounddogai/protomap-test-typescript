/**
 * Checks recommendations against the rules before anything acts on them.
 */

import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { RecommendationValidationWorkflow } from "../application/recommendation-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RecommendationValidationService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationValidationHandler {
  constructor(@inject(RecommendationValidationWorkflow) private readonly workflow: RecommendationValidationWorkflow) {}

  /**
   * Checks a recommendation.
   */
  checkRecommendationEligibility = (call: ServerUnaryCall<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse>, done: sendUnaryData<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse>): void => {
    void this.workflow.checkRecommendationEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a recommendation.
   */
  explainRecommendationDecision = unary<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>(
    (request) => this.workflow.explainRecommendationDecision(request),
  );

  /**
   * Returns a recommendation.
   */
  getRecommendationRules = unary<personalizationRecommendationValidationServiceApi.GetRecommendationRulesRequest, personalizationRecommendationValidationServiceApi.GetRecommendationRulesResponse>(
    (request) => this.workflow.getRecommendationRules(request),
  );

  /**
   * Lints a recommendation.
   */
  lintRecommendations = (call: ServerUnaryCall<personalizationRecommendationValidationServiceApi.LintRecommendationsRequest, personalizationRecommendationValidationServiceApi.LintRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationValidationServiceApi.LintRecommendationsResponse>): void => {
    void this.workflow.lintRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a recommendation.
   */
  normalizeRecommendation = unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse>(
    (request) => this.workflow.normalizeRecommendation(request),
  );

  /**
   * Previews a recommendation.
   */
  previewRecommendation = unary<personalizationRecommendationValidationServiceApi.PreviewRecommendationRequest, personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse>(
    (request) => this.workflow.previewRecommendation(request),
  );

  /**
   * Scores a recommendation.
   */
  scoreRecommendation = (call: ServerUnaryCall<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse>, done: sendUnaryData<personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse>): void => {
    void this.workflow.scoreRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a recommendation.
   */
  validateRecommendation = unary<personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest, personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse>(
    (request) => this.workflow.validateRecommendation(request),
  );
}

export function implementation(handler: RecommendationValidationHandler): personalizationRecommendationValidationServiceApi.RecommendationValidationServiceServer {
  return {
    checkRecommendationEligibility: handler.checkRecommendationEligibility,
    explainRecommendationDecision: handler.explainRecommendationDecision,
    getRecommendationRules: handler.getRecommendationRules,
    lintRecommendations: handler.lintRecommendations,
    normalizeRecommendation: handler.normalizeRecommendation,
    previewRecommendation: handler.previewRecommendation,
    scoreRecommendation: handler.scoreRecommendation,
    validateRecommendation: handler.validateRecommendation,
  };
}
