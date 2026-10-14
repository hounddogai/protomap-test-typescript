/**
 * Computes the figures of a form, such as totals, taxes, and estimates.
 */

import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { FormCalculationWorkflow } from "../application/form-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class FormCalculationHandler {
  constructor(@inject(FormCalculationWorkflow) private readonly workflow: FormCalculationWorkflow) {}

  /**
   * Calculates a form.
   */
  calculateForm = (call: ServerUnaryCall<formsFormCalculationServiceApi.CalculateFormRequest, formsFormCalculationServiceApi.CalculateFormResponse>, done: sendUnaryData<formsFormCalculationServiceApi.CalculateFormResponse>): void => {
    void this.workflow.calculateForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a form.
   */
  compareFormOptions = unary<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse>(
    (request) => this.workflow.compareFormOptions(request),
  );

  /**
   * Estimates a form.
   */
  estimateForm = unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse>(
    (request) => this.workflow.estimateForm(request),
  );

  /**
   * Explains a form.
   */
  explainFormCalculation = (call: ServerUnaryCall<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse>, done: sendUnaryData<formsFormCalculationServiceApi.ExplainFormCalculationResponse>): void => {
    void this.workflow.explainFormCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a form.
   */
  getFormRates = unary<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse>(
    (request) => this.workflow.getFormRates(request),
  );

  /**
   * Quotes a form.
   */
  quoteForm = unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse>(
    (request) => this.workflow.quoteForm(request),
  );

  /**
   * Recalculates a form.
   */
  recalculateForms = (call: ServerUnaryCall<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse>, done: sendUnaryData<formsFormCalculationServiceApi.RecalculateFormsResponse>): void => {
    void this.workflow.recalculateForms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a form.
   */
  simulateForm = unary<formsFormCalculationServiceApi.SimulateFormRequest, formsFormCalculationServiceApi.SimulateFormResponse>(
    (request) => this.workflow.simulateForm(request),
  );
}

export function implementation(handler: FormCalculationHandler): formsFormCalculationServiceApi.FormCalculationServiceServer {
  return {
    calculateForm: handler.calculateForm,
    compareFormOptions: handler.compareFormOptions,
    estimateForm: handler.estimateForm,
    explainFormCalculation: handler.explainFormCalculation,
    getFormRates: handler.getFormRates,
    quoteForm: handler.quoteForm,
    recalculateForms: handler.recalculateForms,
    simulateForm: handler.simulateForm,
  };
}
