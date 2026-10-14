/**
 * Checks affinities against the rules before anything acts on them.
 */

import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AffinityValidationWorkflow } from "./affinity-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityValidationService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityValidationHandler {
  constructor(@inject(AffinityValidationWorkflow) private readonly workflow: AffinityValidationWorkflow) {}

  /**
   * Checks an affinity.
   */
  checkAffinityEligibility = unary<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>(
    (request) => this.workflow.checkAffinityEligibility(request),
  );

  /**
   * Explains an affinity.
   */
  explainAffinityDecision = (call: ServerUnaryCall<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>, done: sendUnaryData<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>): void => {
    void this.workflow.explainAffinityDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints an affinity.
   */
  lintAffinities = unary<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(
    (request) => this.workflow.lintAffinities(request),
  );

  /**
   * Normalizes an affinity.
   */
  normalizeAffinity = unary<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse>(
    (request) => this.workflow.normalizeAffinity(request),
  );

  /**
   * Previews an affinity.
   */
  previewAffinity = (call: ServerUnaryCall<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse>, done: sendUnaryData<personalizationAffinityValidationServiceApi.PreviewAffinityResponse>): void => {
    void this.workflow.previewAffinity(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates an affinity.
   */
  validateAffinity = unary<personalizationAffinityValidationServiceApi.ValidateAffinityRequest, personalizationAffinityValidationServiceApi.ValidateAffinityResponse>(
    (request) => this.workflow.validateAffinity(request),
  );
}

export function implementation(handler: AffinityValidationHandler): personalizationAffinityValidationServiceApi.AffinityValidationServiceServer {
  return {
    checkAffinityEligibility: handler.checkAffinityEligibility,
    explainAffinityDecision: handler.explainAffinityDecision,
    lintAffinities: handler.lintAffinities,
    normalizeAffinity: handler.normalizeAffinity,
    previewAffinity: handler.previewAffinity,
    validateAffinity: handler.validateAffinity,
  };
}
