/**
 * Checks handoffs against the rules before anything acts on them.
 */

import * as chatHandoffValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { HandoffValidationWorkflow } from "./handoff-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for HandoffValidationService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffValidationHandler {
  constructor(@inject(HandoffValidationWorkflow) private readonly workflow: HandoffValidationWorkflow) {}

  /**
   * Checks a handoff.
   */
  checkHandoffEligibility = unary<chatHandoffValidationServiceApi.CheckHandoffEligibilityRequest, chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse>(
    (request) => this.workflow.checkHandoffEligibility(request),
  );

  /**
   * Explains a handoff.
   */
  explainHandoffDecision = (call: ServerUnaryCall<chatHandoffValidationServiceApi.ExplainHandoffDecisionRequest, chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse>, done: sendUnaryData<chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse>): void => {
    void this.workflow.explainHandoffDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a handoff.
   */
  getHandoffRules = unary<chatHandoffValidationServiceApi.GetHandoffRulesRequest, chatHandoffValidationServiceApi.GetHandoffRulesResponse>(
    (request) => this.workflow.getHandoffRules(request),
  );

  /**
   * Lints a handoff.
   */
  lintHandoffs = unary<chatHandoffValidationServiceApi.LintHandoffsRequest, chatHandoffValidationServiceApi.LintHandoffsResponse>(
    (request) => this.workflow.lintHandoffs(request),
  );

  /**
   * Normalizes a handoff.
   */
  normalizeHandoff = (call: ServerUnaryCall<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse>, done: sendUnaryData<chatHandoffValidationServiceApi.NormalizeHandoffResponse>): void => {
    void this.workflow.normalizeHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a handoff.
   */
  previewHandoff = unary<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse>(
    (request) => this.workflow.previewHandoff(request),
  );

  /**
   * Scores a handoff.
   */
  scoreHandoff = unary<chatHandoffValidationServiceApi.ScoreHandoffRequest, chatHandoffValidationServiceApi.ScoreHandoffResponse>(
    (request) => this.workflow.scoreHandoff(request),
  );

  /**
   * Validates a handoff.
   */
  validateHandoff = (call: ServerUnaryCall<chatHandoffValidationServiceApi.ValidateHandoffRequest, chatHandoffValidationServiceApi.ValidateHandoffResponse>, done: sendUnaryData<chatHandoffValidationServiceApi.ValidateHandoffResponse>): void => {
    void this.workflow.validateHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: HandoffValidationHandler): chatHandoffValidationServiceApi.HandoffValidationServiceServer {
  return {
    checkHandoffEligibility: handler.checkHandoffEligibility,
    explainHandoffDecision: handler.explainHandoffDecision,
    getHandoffRules: handler.getHandoffRules,
    lintHandoffs: handler.lintHandoffs,
    normalizeHandoff: handler.normalizeHandoff,
    previewHandoff: handler.previewHandoff,
    scoreHandoff: handler.scoreHandoff,
    validateHandoff: handler.validateHandoff,
  };
}
