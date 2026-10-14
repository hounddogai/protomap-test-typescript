/**
 * Checks locales against the rules before anything acts on them.
 */

import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { LocaleValidationWorkflow } from "./locale-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for LocaleValidationService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleValidationHandler {
  constructor(@inject(LocaleValidationWorkflow) private readonly workflow: LocaleValidationWorkflow) {}

  /**
   * Checks a locale.
   */
  checkLocaleEligibility = unary<localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest, localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse>(
    (request) => this.workflow.checkLocaleEligibility(request),
  );

  /**
   * Explains a locale.
   */
  explainLocaleDecision = (call: ServerUnaryCall<localizationLocaleValidationServiceApi.ExplainLocaleDecisionRequest, localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse>, done: sendUnaryData<localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse>): void => {
    void this.workflow.explainLocaleDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a locale.
   */
  getLocaleRules = unary<localizationLocaleValidationServiceApi.GetLocaleRulesRequest, localizationLocaleValidationServiceApi.GetLocaleRulesResponse>(
    (request) => this.workflow.getLocaleRules(request),
  );

  /**
   * Lints a locale.
   */
  lintLocales = unary<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse>(
    (request) => this.workflow.lintLocales(request),
  );

  /**
   * Normalizes a locale.
   */
  normalizeLocale = (call: ServerUnaryCall<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse>, done: sendUnaryData<localizationLocaleValidationServiceApi.NormalizeLocaleResponse>): void => {
    void this.workflow.normalizeLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a locale.
   */
  previewLocale = unary<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse>(
    (request) => this.workflow.previewLocale(request),
  );

  /**
   * Scores a locale.
   */
  scoreLocale = unary<localizationLocaleValidationServiceApi.ScoreLocaleRequest, localizationLocaleValidationServiceApi.ScoreLocaleResponse>(
    (request) => this.workflow.scoreLocale(request),
  );

  /**
   * Validates a locale.
   */
  validateLocale = (call: ServerUnaryCall<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse>, done: sendUnaryData<localizationLocaleValidationServiceApi.ValidateLocaleResponse>): void => {
    void this.workflow.validateLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: LocaleValidationHandler): localizationLocaleValidationServiceApi.LocaleValidationServiceServer {
  return {
    checkLocaleEligibility: handler.checkLocaleEligibility,
    explainLocaleDecision: handler.explainLocaleDecision,
    getLocaleRules: handler.getLocaleRules,
    lintLocales: handler.lintLocales,
    normalizeLocale: handler.normalizeLocale,
    previewLocale: handler.previewLocale,
    scoreLocale: handler.scoreLocale,
    validateLocale: handler.validateLocale,
  };
}
