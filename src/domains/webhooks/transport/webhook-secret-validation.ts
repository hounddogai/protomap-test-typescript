/**
 * Checks webhook secrets against the rules before anything acts on them.
 */

import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { WebhookSecretValidationWorkflow } from "../application/webhook-secret-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookSecretValidationService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookSecretValidationHandler {
  constructor(@inject(WebhookSecretValidationWorkflow) private readonly workflow: WebhookSecretValidationWorkflow) {}

  /**
   * Checks a webhook secret.
   */
  checkWebhookSecretEligibility = (call: ServerUnaryCall<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>, done: sendUnaryData<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>): void => {
    void this.workflow.checkWebhookSecretEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a webhook secret.
   */
  explainWebhookSecretDecision = unary<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest, webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse>(
    (request) => this.workflow.explainWebhookSecretDecision(request),
  );

  /**
   * Returns a webhook secret.
   */
  getWebhookSecretRules = unary<webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesRequest, webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesResponse>(
    (request) => this.workflow.getWebhookSecretRules(request),
  );

  /**
   * Lints a webhook secret.
   */
  lintWebhookSecrets = (call: ServerUnaryCall<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest, webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse>, done: sendUnaryData<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse>): void => {
    void this.workflow.lintWebhookSecrets(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a webhook secret.
   */
  normalizeWebhookSecret = unary<webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse>(
    (request) => this.workflow.normalizeWebhookSecret(request),
  );

  /**
   * Previews a webhook secret.
   */
  previewWebhookSecret = unary<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse>(
    (request) => this.workflow.previewWebhookSecret(request),
  );

  /**
   * Scores a webhook secret.
   */
  scoreWebhookSecret = (call: ServerUnaryCall<webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse>, done: sendUnaryData<webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse>): void => {
    void this.workflow.scoreWebhookSecret(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a webhook secret.
   */
  validateWebhookSecret = unary<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse>(
    (request) => this.workflow.validateWebhookSecret(request),
  );
}

export function implementation(handler: WebhookSecretValidationHandler): webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceServer {
  return {
    checkWebhookSecretEligibility: handler.checkWebhookSecretEligibility,
    explainWebhookSecretDecision: handler.explainWebhookSecretDecision,
    getWebhookSecretRules: handler.getWebhookSecretRules,
    lintWebhookSecrets: handler.lintWebhookSecrets,
    normalizeWebhookSecret: handler.normalizeWebhookSecret,
    previewWebhookSecret: handler.previewWebhookSecret,
    scoreWebhookSecret: handler.scoreWebhookSecret,
    validateWebhookSecret: handler.validateWebhookSecret,
  };
}
