/**
 * Checks transcode jobs against the rules before anything acts on them.
 */

import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranscodeJobValidationWorkflow } from "../application/transcode-job-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranscodeJobValidationService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobValidationHandler {
  constructor(@inject(TranscodeJobValidationWorkflow) private readonly workflow: TranscodeJobValidationWorkflow) {}

  /**
   * Checks a transcode job.
   */
  checkTranscodeJobEligibility = (call: ServerUnaryCall<mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityRequest, mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse>, done: sendUnaryData<mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse>): void => {
    void this.workflow.checkTranscodeJobEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a transcode job.
   */
  getTranscodeJobRules = unary<mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesRequest, mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse>(
    (request) => this.workflow.getTranscodeJobRules(request),
  );

  /**
   * Lints a transcode job.
   */
  lintTranscodeJobs = unary<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse>(
    (request) => this.workflow.lintTranscodeJobs(request),
  );

  /**
   * Normalizes a transcode job.
   */
  normalizeTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse>): void => {
    void this.workflow.normalizeTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a transcode job.
   */
  previewTranscodeJob = unary<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse>(
    (request) => this.workflow.previewTranscodeJob(request),
  );

  /**
   * Scores a transcode job.
   */
  scoreTranscodeJob = unary<mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse>(
    (request) => this.workflow.scoreTranscodeJob(request),
  );

  /**
   * Validates a transcode job.
   */
  validateTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobResponse>): void => {
    void this.workflow.validateTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: TranscodeJobValidationHandler): mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceServer {
  return {
    checkTranscodeJobEligibility: handler.checkTranscodeJobEligibility,
    getTranscodeJobRules: handler.getTranscodeJobRules,
    lintTranscodeJobs: handler.lintTranscodeJobs,
    normalizeTranscodeJob: handler.normalizeTranscodeJob,
    previewTranscodeJob: handler.previewTranscodeJob,
    scoreTranscodeJob: handler.scoreTranscodeJob,
    validateTranscodeJob: handler.validateTranscodeJob,
  };
}
