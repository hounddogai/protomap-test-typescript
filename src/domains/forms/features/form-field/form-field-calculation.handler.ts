/**
 * Computes the figures of a form field, such as totals, taxes, and estimates.
 */

import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { FormFieldCalculationWorkflow } from "./form-field-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormFieldCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class FormFieldCalculationHandler {
  constructor(@inject(FormFieldCalculationWorkflow) private readonly workflow: FormFieldCalculationWorkflow) {}

  /**
   * Calculates a form field.
   */
  calculateFormField = unary<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>(
    (request) => this.workflow.calculateFormField(request),
  );

  /**
   * Compares a form field.
   */
  compareFormFieldOptions = (call: ServerUnaryCall<formsFormFieldCalculationServiceApi.CompareFormFieldOptionsRequest, formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse>, done: sendUnaryData<formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse>): void => {
    void this.workflow.compareFormFieldOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a form field.
   */
  estimateFormField = unary<formsFormFieldCalculationServiceApi.EstimateFormFieldRequest, formsFormFieldCalculationServiceApi.EstimateFormFieldResponse>(
    (request) => this.workflow.estimateFormField(request),
  );

  /**
   * Returns a form field.
   */
  getFormFieldRates = unary<formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest, formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse>(
    (request) => this.workflow.getFormFieldRates(request),
  );

  /**
   * Quotes a form field.
   */
  quoteFormField = (call: ServerUnaryCall<formsFormFieldCalculationServiceApi.QuoteFormFieldRequest, formsFormFieldCalculationServiceApi.QuoteFormFieldResponse>, done: sendUnaryData<formsFormFieldCalculationServiceApi.QuoteFormFieldResponse>): void => {
    void this.workflow.quoteFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a form field.
   */
  simulateFormField = unary<formsFormFieldCalculationServiceApi.SimulateFormFieldRequest, formsFormFieldCalculationServiceApi.SimulateFormFieldResponse>(
    (request) => this.workflow.simulateFormField(request),
  );
}

export function implementation(handler: FormFieldCalculationHandler): formsFormFieldCalculationServiceApi.FormFieldCalculationServiceServer {
  return {
    calculateFormField: handler.calculateFormField,
    compareFormFieldOptions: handler.compareFormFieldOptions,
    estimateFormField: handler.estimateFormField,
    getFormFieldRates: handler.getFormFieldRates,
    quoteFormField: handler.quoteFormField,
    simulateFormField: handler.simulateFormField,
  };
}
