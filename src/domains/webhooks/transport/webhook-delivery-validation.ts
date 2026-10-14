/**
 * Checks webhook deliveries against the rules before anything acts on them.
 */

import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { WebhookDeliveryValidationWorkflow } from "../application/webhook-delivery-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookDeliveryValidationService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookDeliveryValidationHandler {
  constructor(@inject(WebhookDeliveryValidationWorkflow) private readonly workflow: WebhookDeliveryValidationWorkflow) {}

  /**
   * Checks a webhook delivery.
   */
  checkWebhookDeliveryEligibility = (call: ServerUnaryCall<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse>, done: sendUnaryData<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse>): void => {
    void this.workflow.checkWebhookDeliveryEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a webhook delivery.
   */
  explainWebhookDeliveryDecision = unary<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest, webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse>(
    (request) => this.workflow.explainWebhookDeliveryDecision(request),
  );

  /**
   * Returns a webhook delivery.
   */
  getWebhookDeliveryRules = unary<webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesRequest, webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesResponse>(
    (request) => this.workflow.getWebhookDeliveryRules(request),
  );

  /**
   * Lints a webhook delivery.
   */
  lintWebhookDeliveries = (call: ServerUnaryCall<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse>, done: sendUnaryData<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse>): void => {
    void this.workflow.lintWebhookDeliveries(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a webhook delivery.
   */
  previewWebhookDelivery = unary<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse>(
    (request) => this.workflow.previewWebhookDelivery(request),
  );

  /**
   * Scores a webhook delivery.
   */
  scoreWebhookDelivery = unary<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse>(
    (request) => this.workflow.scoreWebhookDelivery(request),
  );

  /**
   * Validates a webhook delivery.
   */
  validateWebhookDelivery = (call: ServerUnaryCall<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>, done: sendUnaryData<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>): void => {
    void this.workflow.validateWebhookDelivery(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: WebhookDeliveryValidationHandler): webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceServer {
  return {
    checkWebhookDeliveryEligibility: handler.checkWebhookDeliveryEligibility,
    explainWebhookDeliveryDecision: handler.explainWebhookDeliveryDecision,
    getWebhookDeliveryRules: handler.getWebhookDeliveryRules,
    lintWebhookDeliveries: handler.lintWebhookDeliveries,
    previewWebhookDelivery: handler.previewWebhookDelivery,
    scoreWebhookDelivery: handler.scoreWebhookDelivery,
    validateWebhookDelivery: handler.validateWebhookDelivery,
  };
}
