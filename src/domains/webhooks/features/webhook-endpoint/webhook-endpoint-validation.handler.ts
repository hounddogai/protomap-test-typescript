/**
 * Checks webhook endpoints against the rules before anything acts on them.
 */

import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { WebhookEndpointValidationWorkflow } from "./webhook-endpoint-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookEndpointValidationService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookEndpointValidationHandler {
  constructor(@inject(WebhookEndpointValidationWorkflow) private readonly workflow: WebhookEndpointValidationWorkflow) {}

  /**
   * Checks a webhook endpoint.
   */
  checkWebhookEndpointEligibility = unary<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest, webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse>(
    (request) => this.workflow.checkWebhookEndpointEligibility(request),
  );

  /**
   * Explains a webhook endpoint.
   */
  explainWebhookEndpointDecision = (call: ServerUnaryCall<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest, webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse>, done: sendUnaryData<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse>): void => {
    void this.workflow.explainWebhookEndpointDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a webhook endpoint.
   */
  getWebhookEndpointRules = unary<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>(
    (request) => this.workflow.getWebhookEndpointRules(request),
  );

  /**
   * Lints a webhook endpoint.
   */
  lintWebhookEndpoints = unary<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse>(
    (request) => this.workflow.lintWebhookEndpoints(request),
  );

  /**
   * Normalizes a webhook endpoint.
   */
  normalizeWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>): void => {
    void this.workflow.normalizeWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a webhook endpoint.
   */
  previewWebhookEndpoint = unary<webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse>(
    (request) => this.workflow.previewWebhookEndpoint(request),
  );

  /**
   * Scores a webhook endpoint.
   */
  scoreWebhookEndpoint = unary<webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse>(
    (request) => this.workflow.scoreWebhookEndpoint(request),
  );

  /**
   * Validates a webhook endpoint.
   */
  validateWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>): void => {
    void this.workflow.validateWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: WebhookEndpointValidationHandler): webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceServer {
  return {
    checkWebhookEndpointEligibility: handler.checkWebhookEndpointEligibility,
    explainWebhookEndpointDecision: handler.explainWebhookEndpointDecision,
    getWebhookEndpointRules: handler.getWebhookEndpointRules,
    lintWebhookEndpoints: handler.lintWebhookEndpoints,
    normalizeWebhookEndpoint: handler.normalizeWebhookEndpoint,
    previewWebhookEndpoint: handler.previewWebhookEndpoint,
    scoreWebhookEndpoint: handler.scoreWebhookEndpoint,
    validateWebhookEndpoint: handler.validateWebhookEndpoint,
  };
}
