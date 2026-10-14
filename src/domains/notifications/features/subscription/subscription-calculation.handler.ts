/**
 * Computes the figures of a subscription, such as totals, taxes, and estimates.
 */

import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { SubscriptionCalculationWorkflow } from "./subscription-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SubscriptionCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionCalculationHandler {
  constructor(@inject(SubscriptionCalculationWorkflow) private readonly workflow: SubscriptionCalculationWorkflow) {}

  /**
   * Calculates a subscription.
   */
  calculateSubscription = unary<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse>(
    (request) => this.workflow.calculateSubscription(request),
  );

  /**
   * Compares a subscription.
   */
  compareSubscriptionOptions = (call: ServerUnaryCall<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse>, done: sendUnaryData<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse>): void => {
    void this.workflow.compareSubscriptionOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a subscription.
   */
  estimateSubscription = unary<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse>(
    (request) => this.workflow.estimateSubscription(request),
  );

  /**
   * Explains a subscription.
   */
  explainSubscriptionCalculation = unary<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse>(
    (request) => this.workflow.explainSubscriptionCalculation(request),
  );

  /**
   * Returns a subscription.
   */
  getSubscriptionRates = (call: ServerUnaryCall<notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesRequest, notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesResponse>, done: sendUnaryData<notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesResponse>): void => {
    void this.workflow.getSubscriptionRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a subscription.
   */
  quoteSubscription = unary<notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionResponse>(
    (request) => this.workflow.quoteSubscription(request),
  );

  /**
   * Simulates a subscription.
   */
  simulateSubscription = unary<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse>(
    (request) => this.workflow.simulateSubscription(request),
  );
}

export function implementation(handler: SubscriptionCalculationHandler): notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceServer {
  return {
    calculateSubscription: handler.calculateSubscription,
    compareSubscriptionOptions: handler.compareSubscriptionOptions,
    estimateSubscription: handler.estimateSubscription,
    explainSubscriptionCalculation: handler.explainSubscriptionCalculation,
    getSubscriptionRates: handler.getSubscriptionRates,
    quoteSubscription: handler.quoteSubscription,
    simulateSubscription: handler.simulateSubscription,
  };
}
