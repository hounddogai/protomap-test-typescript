/**
 * Checks variants against the rules before anything acts on them.
 */

import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { VariantValidationWorkflow } from "../application/variant-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for VariantValidationService; workflows own validation and database transactions.
 */
@injectable()
export class VariantValidationHandler {
  constructor(@inject(VariantValidationWorkflow) private readonly workflow: VariantValidationWorkflow) {}

  /**
   * Checks a variant.
   */
  checkVariantEligibility = (call: ServerUnaryCall<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>, done: sendUnaryData<experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>): void => {
    void this.workflow.checkVariantEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a variant.
   */
  explainVariantDecision = unary<experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest, experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse>(
    (request) => this.workflow.explainVariantDecision(request),
  );

  /**
   * Lints a variant.
   */
  lintVariants = unary<experimentsVariantValidationServiceApi.LintVariantsRequest, experimentsVariantValidationServiceApi.LintVariantsResponse>(
    (request) => this.workflow.lintVariants(request),
  );

  /**
   * Normalizes a variant.
   */
  normalizeVariant = (call: ServerUnaryCall<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>, done: sendUnaryData<experimentsVariantValidationServiceApi.NormalizeVariantResponse>): void => {
    void this.workflow.normalizeVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a variant.
   */
  previewVariant = unary<experimentsVariantValidationServiceApi.PreviewVariantRequest, experimentsVariantValidationServiceApi.PreviewVariantResponse>(
    (request) => this.workflow.previewVariant(request),
  );

  /**
   * Scores a variant.
   */
  scoreVariant = unary<experimentsVariantValidationServiceApi.ScoreVariantRequest, experimentsVariantValidationServiceApi.ScoreVariantResponse>(
    (request) => this.workflow.scoreVariant(request),
  );

  /**
   * Validates a variant.
   */
  validateVariant = (call: ServerUnaryCall<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse>, done: sendUnaryData<experimentsVariantValidationServiceApi.ValidateVariantResponse>): void => {
    void this.workflow.validateVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: VariantValidationHandler): experimentsVariantValidationServiceApi.VariantValidationServiceServer {
  return {
    checkVariantEligibility: handler.checkVariantEligibility,
    explainVariantDecision: handler.explainVariantDecision,
    lintVariants: handler.lintVariants,
    normalizeVariant: handler.normalizeVariant,
    previewVariant: handler.previewVariant,
    scoreVariant: handler.scoreVariant,
    validateVariant: handler.validateVariant,
  };
}
