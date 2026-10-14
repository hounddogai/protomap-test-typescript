/**
 * Computes the figures of a delivery attempt, such as totals, taxes, and estimates.
 */

import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { DeliveryAttemptCalculationWorkflow } from "../application/delivery-attempt-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptCalculationHandler {
  constructor(@inject(DeliveryAttemptCalculationWorkflow) private readonly workflow: DeliveryAttemptCalculationWorkflow) {}

  /**
   * Calculates a delivery attempt.
   */
  calculateDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse>): void => {
    void this.workflow.calculateDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a delivery attempt.
   */
  estimateDeliveryAttempt = unary<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse>(
    (request) => this.workflow.estimateDeliveryAttempt(request),
  );

  /**
   * Explains a delivery attempt.
   */
  explainDeliveryAttemptCalculation = unary<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse>(
    (request) => this.workflow.explainDeliveryAttemptCalculation(request),
  );

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptRates = (call: ServerUnaryCall<notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesRequest, notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesResponse>, done: sendUnaryData<notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesResponse>): void => {
    void this.workflow.getDeliveryAttemptRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a delivery attempt.
   */
  quoteDeliveryAttempt = unary<notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse>(
    (request) => this.workflow.quoteDeliveryAttempt(request),
  );

  /**
   * Recalculates a delivery attempt.
   */
  recalculateDeliveryAttempts = unary<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse>(
    (request) => this.workflow.recalculateDeliveryAttempts(request),
  );

  /**
   * Simulates a delivery attempt.
   */
  simulateDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse>): void => {
    void this.workflow.simulateDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: DeliveryAttemptCalculationHandler): notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceServer {
  return {
    calculateDeliveryAttempt: handler.calculateDeliveryAttempt,
    estimateDeliveryAttempt: handler.estimateDeliveryAttempt,
    explainDeliveryAttemptCalculation: handler.explainDeliveryAttemptCalculation,
    getDeliveryAttemptRates: handler.getDeliveryAttemptRates,
    quoteDeliveryAttempt: handler.quoteDeliveryAttempt,
    recalculateDeliveryAttempts: handler.recalculateDeliveryAttempts,
    simulateDeliveryAttempt: handler.simulateDeliveryAttempt,
  };
}
