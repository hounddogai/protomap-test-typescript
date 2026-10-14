/**
 * Answers read-only questions about notifications, for screens and reports.
 */

import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { NotificationQueryWorkflow } from "../application/notification-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationQueryService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationQueryHandler {
  constructor(@inject(NotificationQueryWorkflow) private readonly workflow: NotificationQueryWorkflow) {}

  /**
   * Lists notifications a page at a time.
   */
  browseNotifications = (call: ServerUnaryCall<notificationsNotificationQueryServiceApi.BrowseNotificationsRequest, notificationsNotificationQueryServiceApi.BrowseNotificationsResponse>, done: sendUnaryData<notificationsNotificationQueryServiceApi.BrowseNotificationsResponse>): void => {
    void this.workflow.browseNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts notifications by status.
   */
  countNotifications = unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse>(
    (request) => this.workflow.countNotifications(request),
  );

  /**
   * Streams every matching notification.
   */
  exportNotifications = serverStream<notificationsNotificationQueryServiceApi.ExportNotificationsRequest, notificationsNotificationQueryServiceApi.ExportNotificationsResponse>(
    (request) => this.workflow.exportNotifications(request),
  );

  /**
   * Lists notifications a page at a time.
   */
  findNotifications = (call: ServerUnaryCall<notificationsNotificationQueryServiceApi.FindNotificationsRequest, notificationsNotificationQueryServiceApi.FindNotificationsResponse>, done: sendUnaryData<notificationsNotificationQueryServiceApi.FindNotificationsResponse>): void => {
    void this.workflow.findNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a notification.
   */
  lookupNotification = unary<notificationsNotificationQueryServiceApi.LookupNotificationRequest, notificationsNotificationQueryServiceApi.LookupNotificationResponse>(
    (request) => this.workflow.lookupNotification(request),
  );

  /**
   * Returns a notification.
   */
  peekNotification = unary<notificationsNotificationQueryServiceApi.PeekNotificationRequest, notificationsNotificationQueryServiceApi.PeekNotificationResponse>(
    (request) => this.workflow.peekNotification(request),
  );

  /**
   * Returns several notifications at once.
   */
  resolveNotifications = (call: ServerUnaryCall<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>, done: sendUnaryData<notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>): void => {
    void this.workflow.resolveNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a notification.
   */
  summarizeNotifications = unary<notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest, notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse>(
    (request) => this.workflow.summarizeNotifications(request),
  );
}

export function implementation(handler: NotificationQueryHandler): notificationsNotificationQueryServiceApi.NotificationQueryServiceServer {
  return {
    browseNotifications: handler.browseNotifications,
    countNotifications: handler.countNotifications,
    exportNotifications: handler.exportNotifications,
    findNotifications: handler.findNotifications,
    lookupNotification: handler.lookupNotification,
    peekNotification: handler.peekNotification,
    resolveNotifications: handler.resolveNotifications,
    summarizeNotifications: handler.summarizeNotifications,
  };
}
