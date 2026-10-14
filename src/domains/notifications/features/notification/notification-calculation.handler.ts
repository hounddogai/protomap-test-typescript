/**
 * Computes the figures of a notification, such as totals, taxes, and estimates.
 */

import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { NotificationCalculationWorkflow } from "./notification-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationCalculationHandler {
  constructor(@inject(NotificationCalculationWorkflow) private readonly workflow: NotificationCalculationWorkflow) {}

  /**
   * Calculates a notification.
   */
  calculateNotification = unary<notificationsNotificationCalculationServiceApi.CalculateNotificationRequest, notificationsNotificationCalculationServiceApi.CalculateNotificationResponse>(
    (request) => this.workflow.calculateNotification(request),
  );

  /**
   * Compares a notification.
   */
  compareNotificationOptions = (call: ServerUnaryCall<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest, notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse>, done: sendUnaryData<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse>): void => {
    void this.workflow.compareNotificationOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a notification.
   */
  estimateNotification = unary<notificationsNotificationCalculationServiceApi.EstimateNotificationRequest, notificationsNotificationCalculationServiceApi.EstimateNotificationResponse>(
    (request) => this.workflow.estimateNotification(request),
  );

  /**
   * Explains a notification.
   */
  explainNotificationCalculation = unary<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse>(
    (request) => this.workflow.explainNotificationCalculation(request),
  );

  /**
   * Returns a notification.
   */
  getNotificationRates = (call: ServerUnaryCall<notificationsNotificationCalculationServiceApi.GetNotificationRatesRequest, notificationsNotificationCalculationServiceApi.GetNotificationRatesResponse>, done: sendUnaryData<notificationsNotificationCalculationServiceApi.GetNotificationRatesResponse>): void => {
    void this.workflow.getNotificationRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a notification.
   */
  quoteNotification = unary<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse>(
    (request) => this.workflow.quoteNotification(request),
  );

  /**
   * Recalculates a notification.
   */
  recalculateNotifications = unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(
    (request) => this.workflow.recalculateNotifications(request),
  );

  /**
   * Simulates a notification.
   */
  simulateNotification = (call: ServerUnaryCall<notificationsNotificationCalculationServiceApi.SimulateNotificationRequest, notificationsNotificationCalculationServiceApi.SimulateNotificationResponse>, done: sendUnaryData<notificationsNotificationCalculationServiceApi.SimulateNotificationResponse>): void => {
    void this.workflow.simulateNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: NotificationCalculationHandler): notificationsNotificationCalculationServiceApi.NotificationCalculationServiceServer {
  return {
    calculateNotification: handler.calculateNotification,
    compareNotificationOptions: handler.compareNotificationOptions,
    estimateNotification: handler.estimateNotification,
    explainNotificationCalculation: handler.explainNotificationCalculation,
    getNotificationRates: handler.getNotificationRates,
    quoteNotification: handler.quoteNotification,
    recalculateNotifications: handler.recalculateNotifications,
    simulateNotification: handler.simulateNotification,
  };
}
