/**
 * Checks forms against the rules before anything acts on them.
 */

import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { FormValidationWorkflow } from "./form-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormValidationService; workflows own validation and database transactions.
 */
@injectable()
export class FormValidationHandler {
  constructor(@inject(FormValidationWorkflow) private readonly workflow: FormValidationWorkflow) {}

  /**
   * Checks a form.
   */
  checkFormEligibility = unary<formsFormValidationServiceApi.CheckFormEligibilityRequest, formsFormValidationServiceApi.CheckFormEligibilityResponse>(
    (request) => this.workflow.checkFormEligibility(request),
  );

  /**
   * Explains a form.
   */
  explainFormDecision = (call: ServerUnaryCall<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse>, done: sendUnaryData<formsFormValidationServiceApi.ExplainFormDecisionResponse>): void => {
    void this.workflow.explainFormDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a form.
   */
  getFormRules = unary<formsFormValidationServiceApi.GetFormRulesRequest, formsFormValidationServiceApi.GetFormRulesResponse>(
    (request) => this.workflow.getFormRules(request),
  );

  /**
   * Lints a form.
   */
  lintForms = unary<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse>(
    (request) => this.workflow.lintForms(request),
  );

  /**
   * Normalizes a form.
   */
  normalizeForm = (call: ServerUnaryCall<formsFormValidationServiceApi.NormalizeFormRequest, formsFormValidationServiceApi.NormalizeFormResponse>, done: sendUnaryData<formsFormValidationServiceApi.NormalizeFormResponse>): void => {
    void this.workflow.normalizeForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a form.
   */
  previewForm = unary<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse>(
    (request) => this.workflow.previewForm(request),
  );

  /**
   * Scores a form.
   */
  scoreForm = unary<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse>(
    (request) => this.workflow.scoreForm(request),
  );

  /**
   * Validates a form.
   */
  validateForm = (call: ServerUnaryCall<formsFormValidationServiceApi.ValidateFormRequest, formsFormValidationServiceApi.ValidateFormResponse>, done: sendUnaryData<formsFormValidationServiceApi.ValidateFormResponse>): void => {
    void this.workflow.validateForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: FormValidationHandler): formsFormValidationServiceApi.FormValidationServiceServer {
  return {
    checkFormEligibility: handler.checkFormEligibility,
    explainFormDecision: handler.explainFormDecision,
    getFormRules: handler.getFormRules,
    lintForms: handler.lintForms,
    normalizeForm: handler.normalizeForm,
    previewForm: handler.previewForm,
    scoreForm: handler.scoreForm,
    validateForm: handler.validateForm,
  };
}
