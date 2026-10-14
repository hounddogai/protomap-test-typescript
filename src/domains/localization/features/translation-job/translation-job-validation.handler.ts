/**
 * Checks translation jobs against the rules before anything acts on them.
 */

import * as localizationTranslationJobValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { TranslationJobValidationWorkflow } from "./translation-job-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationJobValidationService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobValidationHandler {
  constructor(@inject(TranslationJobValidationWorkflow) private readonly workflow: TranslationJobValidationWorkflow) {}

  /**
   * Explains a translation job.
   */
  explainTranslationJobDecision = unary<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse>(
    (request) => this.workflow.explainTranslationJobDecision(request),
  );

  /**
   * Returns a translation job.
   */
  getTranslationJobRules = (call: ServerUnaryCall<localizationTranslationJobValidationServiceApi.GetTranslationJobRulesRequest, localizationTranslationJobValidationServiceApi.GetTranslationJobRulesResponse>, done: sendUnaryData<localizationTranslationJobValidationServiceApi.GetTranslationJobRulesResponse>): void => {
    void this.workflow.getTranslationJobRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a translation job.
   */
  lintTranslationJobs = unary<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>(
    (request) => this.workflow.lintTranslationJobs(request),
  );

  /**
   * Normalizes a translation job.
   */
  normalizeTranslationJob = unary<localizationTranslationJobValidationServiceApi.NormalizeTranslationJobRequest, localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse>(
    (request) => this.workflow.normalizeTranslationJob(request),
  );

  /**
   * Previews a translation job.
   */
  previewTranslationJob = (call: ServerUnaryCall<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse>, done: sendUnaryData<localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse>): void => {
    void this.workflow.previewTranslationJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a translation job.
   */
  scoreTranslationJob = unary<localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest, localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse>(
    (request) => this.workflow.scoreTranslationJob(request),
  );

  /**
   * Validates a translation job.
   */
  validateTranslationJob = unary<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse>(
    (request) => this.workflow.validateTranslationJob(request),
  );
}

export function implementation(handler: TranslationJobValidationHandler): localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceServer {
  return {
    explainTranslationJobDecision: handler.explainTranslationJobDecision,
    getTranslationJobRules: handler.getTranslationJobRules,
    lintTranslationJobs: handler.lintTranslationJobs,
    normalizeTranslationJob: handler.normalizeTranslationJob,
    previewTranslationJob: handler.previewTranslationJob,
    scoreTranslationJob: handler.scoreTranslationJob,
    validateTranslationJob: handler.validateTranslationJob,
  };
}
