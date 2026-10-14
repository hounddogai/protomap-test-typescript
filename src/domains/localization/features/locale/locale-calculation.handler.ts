/**
 * Computes the figures of a locale, such as totals, taxes, and estimates.
 */

import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { LocaleCalculationWorkflow } from "./locale-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for LocaleCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleCalculationHandler {
  constructor(@inject(LocaleCalculationWorkflow) private readonly workflow: LocaleCalculationWorkflow) {}

  /**
   * Calculates a locale.
   */
  calculateLocale = unary<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse>(
    (request) => this.workflow.calculateLocale(request),
  );

  /**
   * Compares a locale.
   */
  compareLocaleOptions = (call: ServerUnaryCall<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse>, done: sendUnaryData<localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse>): void => {
    void this.workflow.compareLocaleOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a locale.
   */
  estimateLocale = unary<localizationLocaleCalculationServiceApi.EstimateLocaleRequest, localizationLocaleCalculationServiceApi.EstimateLocaleResponse>(
    (request) => this.workflow.estimateLocale(request),
  );

  /**
   * Explains a locale.
   */
  explainLocaleCalculation = unary<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest, localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse>(
    (request) => this.workflow.explainLocaleCalculation(request),
  );

  /**
   * Returns a locale.
   */
  getLocaleRates = (call: ServerUnaryCall<localizationLocaleCalculationServiceApi.GetLocaleRatesRequest, localizationLocaleCalculationServiceApi.GetLocaleRatesResponse>, done: sendUnaryData<localizationLocaleCalculationServiceApi.GetLocaleRatesResponse>): void => {
    void this.workflow.getLocaleRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a locale.
   */
  quoteLocale = unary<localizationLocaleCalculationServiceApi.QuoteLocaleRequest, localizationLocaleCalculationServiceApi.QuoteLocaleResponse>(
    (request) => this.workflow.quoteLocale(request),
  );

  /**
   * Recalculates a locale.
   */
  recalculateLocales = unary<localizationLocaleCalculationServiceApi.RecalculateLocalesRequest, localizationLocaleCalculationServiceApi.RecalculateLocalesResponse>(
    (request) => this.workflow.recalculateLocales(request),
  );

  /**
   * Simulates a locale.
   */
  simulateLocale = (call: ServerUnaryCall<localizationLocaleCalculationServiceApi.SimulateLocaleRequest, localizationLocaleCalculationServiceApi.SimulateLocaleResponse>, done: sendUnaryData<localizationLocaleCalculationServiceApi.SimulateLocaleResponse>): void => {
    void this.workflow.simulateLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: LocaleCalculationHandler): localizationLocaleCalculationServiceApi.LocaleCalculationServiceServer {
  return {
    calculateLocale: handler.calculateLocale,
    compareLocaleOptions: handler.compareLocaleOptions,
    estimateLocale: handler.estimateLocale,
    explainLocaleCalculation: handler.explainLocaleCalculation,
    getLocaleRates: handler.getLocaleRates,
    quoteLocale: handler.quoteLocale,
    recalculateLocales: handler.recalculateLocales,
    simulateLocale: handler.simulateLocale,
  };
}
