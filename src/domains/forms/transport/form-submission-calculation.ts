/**
 * Computes the figures of a form submission, such as totals, taxes, and estimates.
 */

import * as formsFormSubmissionCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { FormSubmissionCalculationWorkflow } from "../application/form-submission-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormSubmissionCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionCalculationHandler {
  constructor(@inject(FormSubmissionCalculationWorkflow) private readonly workflow: FormSubmissionCalculationWorkflow) {}

  /**
   * Calculates a form submission.
   */
  calculateFormSubmission = (call: ServerUnaryCall<formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionResponse>, done: sendUnaryData<formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionResponse>): void => {
    void this.workflow.calculateFormSubmission(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a form submission.
   */
  compareFormSubmissionOptions = unary<formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsRequest, formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse>(
    (request) => this.workflow.compareFormSubmissionOptions(request),
  );

  /**
   * Estimates a form submission.
   */
  estimateFormSubmission = unary<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse>(
    (request) => this.workflow.estimateFormSubmission(request),
  );

  /**
   * Explains a form submission.
   */
  explainFormSubmissionCalculation = (call: ServerUnaryCall<formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationRequest, formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse>, done: sendUnaryData<formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse>): void => {
    void this.workflow.explainFormSubmissionCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a form submission.
   */
  getFormSubmissionRates = unary<formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest, formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse>(
    (request) => this.workflow.getFormSubmissionRates(request),
  );

  /**
   * Quotes a form submission.
   */
  quoteFormSubmission = unary<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse>(
    (request) => this.workflow.quoteFormSubmission(request),
  );

  /**
   * Recalculates a form submission.
   */
  recalculateFormSubmissions = (call: ServerUnaryCall<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse>, done: sendUnaryData<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse>): void => {
    void this.workflow.recalculateFormSubmissions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a form submission.
   */
  simulateFormSubmission = unary<formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionResponse>(
    (request) => this.workflow.simulateFormSubmission(request),
  );
}

export function implementation(handler: FormSubmissionCalculationHandler): formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceServer {
  return {
    calculateFormSubmission: handler.calculateFormSubmission,
    compareFormSubmissionOptions: handler.compareFormSubmissionOptions,
    estimateFormSubmission: handler.estimateFormSubmission,
    explainFormSubmissionCalculation: handler.explainFormSubmissionCalculation,
    getFormSubmissionRates: handler.getFormSubmissionRates,
    quoteFormSubmission: handler.quoteFormSubmission,
    recalculateFormSubmissions: handler.recalculateFormSubmissions,
    simulateFormSubmission: handler.simulateFormSubmission,
  };
}
