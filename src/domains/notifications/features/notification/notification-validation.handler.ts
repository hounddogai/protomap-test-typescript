/**
 * Checks notifications against the rules before anything acts on them.
 */

import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { NotificationValidationWorkflow } from "./notification-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationValidationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationValidationHandler {
  constructor(@inject(NotificationValidationWorkflow) private readonly workflow: NotificationValidationWorkflow) {}

  /**
   * Checks a notification.
   */
  checkNotificationEligibility = unary<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>(
    (request) => this.workflow.checkNotificationEligibility(request),
  );

  /**
   * Explains a notification.
   */
  explainNotificationDecision = (call: ServerUnaryCall<notificationsNotificationValidationServiceApi.ExplainNotificationDecisionRequest, notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse>, done: sendUnaryData<notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse>): void => {
    void this.workflow.explainNotificationDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a notification.
   */
  getNotificationRules = unary<notificationsNotificationValidationServiceApi.GetNotificationRulesRequest, notificationsNotificationValidationServiceApi.GetNotificationRulesResponse>(
    (request) => this.workflow.getNotificationRules(request),
  );

  /**
   * Lints a notification.
   */
  lintNotifications = unary<notificationsNotificationValidationServiceApi.LintNotificationsRequest, notificationsNotificationValidationServiceApi.LintNotificationsResponse>(
    (request) => this.workflow.lintNotifications(request),
  );

  /**
   * Normalizes a notification.
   */
  normalizeNotification = (call: ServerUnaryCall<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse>, done: sendUnaryData<notificationsNotificationValidationServiceApi.NormalizeNotificationResponse>): void => {
    void this.workflow.normalizeNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a notification.
   */
  previewNotification = unary<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse>(
    (request) => this.workflow.previewNotification(request),
  );

  /**
   * Scores a notification.
   */
  scoreNotification = unary<notificationsNotificationValidationServiceApi.ScoreNotificationRequest, notificationsNotificationValidationServiceApi.ScoreNotificationResponse>(
    (request) => this.workflow.scoreNotification(request),
  );

  /**
   * Validates a notification.
   */
  validateNotification = (call: ServerUnaryCall<notificationsNotificationValidationServiceApi.ValidateNotificationRequest, notificationsNotificationValidationServiceApi.ValidateNotificationResponse>, done: sendUnaryData<notificationsNotificationValidationServiceApi.ValidateNotificationResponse>): void => {
    void this.workflow.validateNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: NotificationValidationHandler): notificationsNotificationValidationServiceApi.NotificationValidationServiceServer {
  return {
    checkNotificationEligibility: handler.checkNotificationEligibility,
    explainNotificationDecision: handler.explainNotificationDecision,
    getNotificationRules: handler.getNotificationRules,
    lintNotifications: handler.lintNotifications,
    normalizeNotification: handler.normalizeNotification,
    previewNotification: handler.previewNotification,
    scoreNotification: handler.scoreNotification,
    validateNotification: handler.validateNotification,
  };
}
