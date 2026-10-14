/**
 * Checks experiments against the rules before anything acts on them.
 */

import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ExperimentValidationWorkflow } from "./experiment-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentValidationHandler {
  constructor(@inject(ExperimentValidationWorkflow) private readonly workflow: ExperimentValidationWorkflow) {}

  /**
   * Checks an experiment.
   */
  checkExperimentEligibility = unary<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(
    (request) => this.workflow.checkExperimentEligibility(request),
  );

  /**
   * Explains an experiment.
   */
  explainExperimentDecision = (call: ServerUnaryCall<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>, done: sendUnaryData<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>): void => {
    void this.workflow.explainExperimentDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an experiment.
   */
  getExperimentRules = unary<experimentsExperimentValidationServiceApi.GetExperimentRulesRequest, experimentsExperimentValidationServiceApi.GetExperimentRulesResponse>(
    (request) => this.workflow.getExperimentRules(request),
  );

  /**
   * Lints an experiment.
   */
  lintExperiments = unary<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse>(
    (request) => this.workflow.lintExperiments(request),
  );

  /**
   * Normalizes an experiment.
   */
  normalizeExperiment = (call: ServerUnaryCall<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>, done: sendUnaryData<experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>): void => {
    void this.workflow.normalizeExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews an experiment.
   */
  previewExperiment = unary<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse>(
    (request) => this.workflow.previewExperiment(request),
  );

  /**
   * Scores an experiment.
   */
  scoreExperiment = unary<experimentsExperimentValidationServiceApi.ScoreExperimentRequest, experimentsExperimentValidationServiceApi.ScoreExperimentResponse>(
    (request) => this.workflow.scoreExperiment(request),
  );

  /**
   * Validates an experiment.
   */
  validateExperiment = (call: ServerUnaryCall<experimentsExperimentValidationServiceApi.ValidateExperimentRequest, experimentsExperimentValidationServiceApi.ValidateExperimentResponse>, done: sendUnaryData<experimentsExperimentValidationServiceApi.ValidateExperimentResponse>): void => {
    void this.workflow.validateExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ExperimentValidationHandler): experimentsExperimentValidationServiceApi.ExperimentValidationServiceServer {
  return {
    checkExperimentEligibility: handler.checkExperimentEligibility,
    explainExperimentDecision: handler.explainExperimentDecision,
    getExperimentRules: handler.getExperimentRules,
    lintExperiments: handler.lintExperiments,
    normalizeExperiment: handler.normalizeExperiment,
    previewExperiment: handler.previewExperiment,
    scoreExperiment: handler.scoreExperiment,
    validateExperiment: handler.validateExperiment,
  };
}
