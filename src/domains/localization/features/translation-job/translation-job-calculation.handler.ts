/**
 * Computes the figures of a translation job, such as totals, taxes, and estimates.
 */

import * as localizationTranslationJobCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { TranslationJobCalculationWorkflow } from "./translation-job-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationJobCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobCalculationHandler {
  constructor(@inject(TranslationJobCalculationWorkflow) private readonly workflow: TranslationJobCalculationWorkflow) {}

  /**
   * Calculates a translation job.
   */
  calculateTranslationJob = unary<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>(
    (request) => this.workflow.calculateTranslationJob(request),
  );

  /**
   * Compares a translation job.
   */
  compareTranslationJobOptions = (call: ServerUnaryCall<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>, done: sendUnaryData<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>): void => {
    void this.workflow.compareTranslationJobOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a translation job.
   */
  estimateTranslationJob = unary<localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse>(
    (request) => this.workflow.estimateTranslationJob(request),
  );

  /**
   * Explains a translation job.
   */
  explainTranslationJobCalculation = unary<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(
    (request) => this.workflow.explainTranslationJobCalculation(request),
  );

  /**
   * Returns a translation job.
   */
  getTranslationJobRates = (call: ServerUnaryCall<localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesRequest, localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse>, done: sendUnaryData<localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse>): void => {
    void this.workflow.getTranslationJobRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a translation job.
   */
  quoteTranslationJob = unary<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse>(
    (request) => this.workflow.quoteTranslationJob(request),
  );

  /**
   * Recalculates a translation job.
   */
  recalculateTranslationJobs = unary<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse>(
    (request) => this.workflow.recalculateTranslationJobs(request),
  );
}

export function implementation(handler: TranslationJobCalculationHandler): localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceServer {
  return {
    calculateTranslationJob: handler.calculateTranslationJob,
    compareTranslationJobOptions: handler.compareTranslationJobOptions,
    estimateTranslationJob: handler.estimateTranslationJob,
    explainTranslationJobCalculation: handler.explainTranslationJobCalculation,
    getTranslationJobRates: handler.getTranslationJobRates,
    quoteTranslationJob: handler.quoteTranslationJob,
    recalculateTranslationJobs: handler.recalculateTranslationJobs,
  };
}
