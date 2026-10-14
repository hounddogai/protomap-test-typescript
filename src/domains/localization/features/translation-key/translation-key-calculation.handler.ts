/**
 * Computes the figures of a translation key, such as totals, taxes, and estimates.
 */

import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { TranslationKeyCalculationWorkflow } from "./translation-key-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationKeyCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyCalculationHandler {
  constructor(@inject(TranslationKeyCalculationWorkflow) private readonly workflow: TranslationKeyCalculationWorkflow) {}

  /**
   * Calculates a translation key.
   */
  calculateTranslationKey = unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(
    (request) => this.workflow.calculateTranslationKey(request),
  );

  /**
   * Compares a translation key.
   */
  compareTranslationKeyOptions = (call: ServerUnaryCall<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>, done: sendUnaryData<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>): void => {
    void this.workflow.compareTranslationKeyOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a translation key.
   */
  estimateTranslationKey = unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(
    (request) => this.workflow.estimateTranslationKey(request),
  );

  /**
   * Explains a translation key.
   */
  explainTranslationKeyCalculation = unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(
    (request) => this.workflow.explainTranslationKeyCalculation(request),
  );

  /**
   * Returns a translation key.
   */
  getTranslationKeyRates = (call: ServerUnaryCall<localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest, localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse>, done: sendUnaryData<localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse>): void => {
    void this.workflow.getTranslationKeyRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a translation key.
   */
  quoteTranslationKey = unary<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse>(
    (request) => this.workflow.quoteTranslationKey(request),
  );

  /**
   * Recalculates a translation key.
   */
  recalculateTranslationKeys = unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(
    (request) => this.workflow.recalculateTranslationKeys(request),
  );
}

export function implementation(handler: TranslationKeyCalculationHandler): localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceServer {
  return {
    calculateTranslationKey: handler.calculateTranslationKey,
    compareTranslationKeyOptions: handler.compareTranslationKeyOptions,
    estimateTranslationKey: handler.estimateTranslationKey,
    explainTranslationKeyCalculation: handler.explainTranslationKeyCalculation,
    getTranslationKeyRates: handler.getTranslationKeyRates,
    quoteTranslationKey: handler.quoteTranslationKey,
    recalculateTranslationKeys: handler.recalculateTranslationKeys,
  };
}
