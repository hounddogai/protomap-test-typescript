/**
 * Computes the figures of a webhook secret, such as totals, taxes, and estimates.
 */

import * as webhooksWebhookSecretCalculationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { WebhookSecretCalculationWorkflow } from "./webhook-secret-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookSecretCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookSecretCalculationHandler {
  constructor(@inject(WebhookSecretCalculationWorkflow) private readonly workflow: WebhookSecretCalculationWorkflow) {}

  /**
   * Calculates a webhook secret.
   */
  calculateWebhookSecret = unary<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(
    (request) => this.workflow.calculateWebhookSecret(request),
  );

  /**
   * Estimates a webhook secret.
   */
  estimateWebhookSecret = (call: ServerUnaryCall<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>, done: sendUnaryData<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>): void => {
    void this.workflow.estimateWebhookSecret(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a webhook secret.
   */
  explainWebhookSecretCalculation = unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(
    (request) => this.workflow.explainWebhookSecretCalculation(request),
  );

  /**
   * Returns a webhook secret.
   */
  getWebhookSecretRates = unary<webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesRequest, webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesResponse>(
    (request) => this.workflow.getWebhookSecretRates(request),
  );

  /**
   * Quotes a webhook secret.
   */
  quoteWebhookSecret = (call: ServerUnaryCall<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse>, done: sendUnaryData<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse>): void => {
    void this.workflow.quoteWebhookSecret(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a webhook secret.
   */
  recalculateWebhookSecrets = unary<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse>(
    (request) => this.workflow.recalculateWebhookSecrets(request),
  );

  /**
   * Simulates a webhook secret.
   */
  simulateWebhookSecret = unary<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(
    (request) => this.workflow.simulateWebhookSecret(request),
  );
}

export function implementation(handler: WebhookSecretCalculationHandler): webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceServer {
  return {
    calculateWebhookSecret: handler.calculateWebhookSecret,
    estimateWebhookSecret: handler.estimateWebhookSecret,
    explainWebhookSecretCalculation: handler.explainWebhookSecretCalculation,
    getWebhookSecretRates: handler.getWebhookSecretRates,
    quoteWebhookSecret: handler.quoteWebhookSecret,
    recalculateWebhookSecrets: handler.recalculateWebhookSecrets,
    simulateWebhookSecret: handler.simulateWebhookSecret,
  };
}
