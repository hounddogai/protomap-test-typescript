/**
 * Checks form submissions against the rules before anything acts on them.
 */

import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { FormSubmissionValidationWorkflow } from "../application/form-submission-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormSubmissionValidationService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionValidationHandler {
  constructor(@inject(FormSubmissionValidationWorkflow) private readonly workflow: FormSubmissionValidationWorkflow) {}

  /**
   * Checks a form submission.
   */
  checkFormSubmissionEligibility = (call: ServerUnaryCall<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest, formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse>, done: sendUnaryData<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse>): void => {
    void this.workflow.checkFormSubmissionEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a form submission.
   */
  explainFormSubmissionDecision = unary<formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionRequest, formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionResponse>(
    (request) => this.workflow.explainFormSubmissionDecision(request),
  );

  /**
   * Returns a form submission.
   */
  getFormSubmissionRules = unary<formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesRequest, formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesResponse>(
    (request) => this.workflow.getFormSubmissionRules(request),
  );

  /**
   * Lints a form submission.
   */
  lintFormSubmissions = (call: ServerUnaryCall<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>, done: sendUnaryData<formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>): void => {
    void this.workflow.lintFormSubmissions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a form submission.
   */
  normalizeFormSubmission = unary<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse>(
    (request) => this.workflow.normalizeFormSubmission(request),
  );

  /**
   * Previews a form submission.
   */
  previewFormSubmission = unary<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse>(
    (request) => this.workflow.previewFormSubmission(request),
  );

  /**
   * Scores a form submission.
   */
  scoreFormSubmission = (call: ServerUnaryCall<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse>, done: sendUnaryData<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse>): void => {
    void this.workflow.scoreFormSubmission(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a form submission.
   */
  validateFormSubmission = unary<formsFormSubmissionValidationServiceApi.ValidateFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ValidateFormSubmissionResponse>(
    (request) => this.workflow.validateFormSubmission(request),
  );
}

export function implementation(handler: FormSubmissionValidationHandler): formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceServer {
  return {
    checkFormSubmissionEligibility: handler.checkFormSubmissionEligibility,
    explainFormSubmissionDecision: handler.explainFormSubmissionDecision,
    getFormSubmissionRules: handler.getFormSubmissionRules,
    lintFormSubmissions: handler.lintFormSubmissions,
    normalizeFormSubmission: handler.normalizeFormSubmission,
    previewFormSubmission: handler.previewFormSubmission,
    scoreFormSubmission: handler.scoreFormSubmission,
    validateFormSubmission: handler.validateFormSubmission,
  };
}
