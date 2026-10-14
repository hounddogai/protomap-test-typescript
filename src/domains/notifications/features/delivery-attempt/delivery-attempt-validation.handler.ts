/**
 * Checks delivery attempts against the rules before anything acts on them.
 */

import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { DeliveryAttemptValidationWorkflow } from "./delivery-attempt-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptValidationService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptValidationHandler {
  constructor(@inject(DeliveryAttemptValidationWorkflow) private readonly workflow: DeliveryAttemptValidationWorkflow) {}

  /**
   * Checks a delivery attempt.
   */
  checkDeliveryAttemptEligibility = unary<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse>(
    (request) => this.workflow.checkDeliveryAttemptEligibility(request),
  );

  /**
   * Explains a delivery attempt.
   */
  explainDeliveryAttemptDecision = (call: ServerUnaryCall<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>, done: sendUnaryData<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>): void => {
    void this.workflow.explainDeliveryAttemptDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptRules = unary<notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest, notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesResponse>(
    (request) => this.workflow.getDeliveryAttemptRules(request),
  );

  /**
   * Lints a delivery attempt.
   */
  lintDeliveryAttempts = unary<notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsRequest, notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsResponse>(
    (request) => this.workflow.lintDeliveryAttempts(request),
  );

  /**
   * Normalizes a delivery attempt.
   */
  normalizeDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>): void => {
    void this.workflow.normalizeDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a delivery attempt.
   */
  previewDeliveryAttempt = unary<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse>(
    (request) => this.workflow.previewDeliveryAttempt(request),
  );

  /**
   * Scores a delivery attempt.
   */
  scoreDeliveryAttempt = unary<notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptResponse>(
    (request) => this.workflow.scoreDeliveryAttempt(request),
  );

  /**
   * Validates a delivery attempt.
   */
  validateDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse>): void => {
    void this.workflow.validateDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: DeliveryAttemptValidationHandler): notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceServer {
  return {
    checkDeliveryAttemptEligibility: handler.checkDeliveryAttemptEligibility,
    explainDeliveryAttemptDecision: handler.explainDeliveryAttemptDecision,
    getDeliveryAttemptRules: handler.getDeliveryAttemptRules,
    lintDeliveryAttempts: handler.lintDeliveryAttempts,
    normalizeDeliveryAttempt: handler.normalizeDeliveryAttempt,
    previewDeliveryAttempt: handler.previewDeliveryAttempt,
    scoreDeliveryAttempt: handler.scoreDeliveryAttempt,
    validateDeliveryAttempt: handler.validateDeliveryAttempt,
  };
}
