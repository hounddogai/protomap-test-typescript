/**
 * Checks translation keys against the rules before anything acts on them.
 */

import * as localizationTranslationKeyValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { TranslationKeyValidationWorkflow } from "./translation-key-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationKeyValidationService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyValidationHandler {
  constructor(@inject(TranslationKeyValidationWorkflow) private readonly workflow: TranslationKeyValidationWorkflow) {}

  /**
   * Checks a translation key.
   */
  checkTranslationKeyEligibility = unary<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>(
    (request) => this.workflow.checkTranslationKeyEligibility(request),
  );

  /**
   * Explains a translation key.
   */
  explainTranslationKeyDecision = (call: ServerUnaryCall<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse>, done: sendUnaryData<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse>): void => {
    void this.workflow.explainTranslationKeyDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a translation key.
   */
  getTranslationKeyRules = unary<localizationTranslationKeyValidationServiceApi.GetTranslationKeyRulesRequest, localizationTranslationKeyValidationServiceApi.GetTranslationKeyRulesResponse>(
    (request) => this.workflow.getTranslationKeyRules(request),
  );

  /**
   * Normalizes a translation key.
   */
  normalizeTranslationKey = unary<localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse>(
    (request) => this.workflow.normalizeTranslationKey(request),
  );

  /**
   * Previews a translation key.
   */
  previewTranslationKey = (call: ServerUnaryCall<localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse>, done: sendUnaryData<localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse>): void => {
    void this.workflow.previewTranslationKey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a translation key.
   */
  scoreTranslationKey = unary<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse>(
    (request) => this.workflow.scoreTranslationKey(request),
  );

  /**
   * Validates a translation key.
   */
  validateTranslationKey = unary<localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse>(
    (request) => this.workflow.validateTranslationKey(request),
  );
}

export function implementation(handler: TranslationKeyValidationHandler): localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceServer {
  return {
    checkTranslationKeyEligibility: handler.checkTranslationKeyEligibility,
    explainTranslationKeyDecision: handler.explainTranslationKeyDecision,
    getTranslationKeyRules: handler.getTranslationKeyRules,
    normalizeTranslationKey: handler.normalizeTranslationKey,
    previewTranslationKey: handler.previewTranslationKey,
    scoreTranslationKey: handler.scoreTranslationKey,
    validateTranslationKey: handler.validateTranslationKey,
  };
}
