/**
 * Checks moderations against the rules before anything acts on them.
 */

import * as communityModerationValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ModerationValidationWorkflow } from "./moderation-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ModerationValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ModerationValidationHandler {
  constructor(@inject(ModerationValidationWorkflow) private readonly workflow: ModerationValidationWorkflow) {}

  /**
   * Checks a moderation.
   */
  checkModerationEligibility = unary<communityModerationValidationServiceApi.CheckModerationEligibilityRequest, communityModerationValidationServiceApi.CheckModerationEligibilityResponse>(
    (request) => this.workflow.checkModerationEligibility(request),
  );

  /**
   * Explains a moderation.
   */
  explainModerationDecision = (call: ServerUnaryCall<communityModerationValidationServiceApi.ExplainModerationDecisionRequest, communityModerationValidationServiceApi.ExplainModerationDecisionResponse>, done: sendUnaryData<communityModerationValidationServiceApi.ExplainModerationDecisionResponse>): void => {
    void this.workflow.explainModerationDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a moderation.
   */
  getModerationRules = unary<communityModerationValidationServiceApi.GetModerationRulesRequest, communityModerationValidationServiceApi.GetModerationRulesResponse>(
    (request) => this.workflow.getModerationRules(request),
  );

  /**
   * Lints a moderation.
   */
  lintModerations = unary<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse>(
    (request) => this.workflow.lintModerations(request),
  );

  /**
   * Normalizes a moderation.
   */
  normalizeModeration = (call: ServerUnaryCall<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse>, done: sendUnaryData<communityModerationValidationServiceApi.NormalizeModerationResponse>): void => {
    void this.workflow.normalizeModeration(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a moderation.
   */
  previewModeration = unary<communityModerationValidationServiceApi.PreviewModerationRequest, communityModerationValidationServiceApi.PreviewModerationResponse>(
    (request) => this.workflow.previewModeration(request),
  );

  /**
   * Scores a moderation.
   */
  scoreModeration = unary<communityModerationValidationServiceApi.ScoreModerationRequest, communityModerationValidationServiceApi.ScoreModerationResponse>(
    (request) => this.workflow.scoreModeration(request),
  );

  /**
   * Validates a moderation.
   */
  validateModeration = (call: ServerUnaryCall<communityModerationValidationServiceApi.ValidateModerationRequest, communityModerationValidationServiceApi.ValidateModerationResponse>, done: sendUnaryData<communityModerationValidationServiceApi.ValidateModerationResponse>): void => {
    void this.workflow.validateModeration(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ModerationValidationHandler): communityModerationValidationServiceApi.ModerationValidationServiceServer {
  return {
    checkModerationEligibility: handler.checkModerationEligibility,
    explainModerationDecision: handler.explainModerationDecision,
    getModerationRules: handler.getModerationRules,
    lintModerations: handler.lintModerations,
    normalizeModeration: handler.normalizeModeration,
    previewModeration: handler.previewModeration,
    scoreModeration: handler.scoreModeration,
    validateModeration: handler.validateModeration,
  };
}
