/**
 * Exports notifications to files and other systems.
 */

import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { NotificationExportWorkflow } from "../application/notification-export.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationExportService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationExportHandler {
  constructor(@inject(NotificationExportWorkflow) private readonly workflow: NotificationExportWorkflow) {}

  /**
   * Cancels a notification.
   */
  cancelNotificationExport = (call: ServerUnaryCall<notificationsNotificationExportServiceApi.CancelNotificationExportRequest, notificationsNotificationExportServiceApi.CancelNotificationExportResponse>, done: sendUnaryData<notificationsNotificationExportServiceApi.CancelNotificationExportResponse>): void => {
    void this.workflow.cancelNotificationExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a notification.
   */
  getNotificationExport = unary<notificationsNotificationExportServiceApi.GetNotificationExportRequest, notificationsNotificationExportServiceApi.GetNotificationExportResponse>(
    (request) => this.workflow.getNotificationExport(request),
  );

  /**
   * Lists notifications a page at a time.
   */
  listNotificationExports = unary<notificationsNotificationExportServiceApi.ListNotificationExportsRequest, notificationsNotificationExportServiceApi.ListNotificationExportsResponse>(
    (request) => this.workflow.listNotificationExports(request),
  );

  /**
   * Retrys a notification.
   */
  retryNotificationExport = (call: ServerUnaryCall<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse>, done: sendUnaryData<notificationsNotificationExportServiceApi.RetryNotificationExportResponse>): void => {
    void this.workflow.retryNotificationExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a notification.
   */
  scheduleNotificationExport = unary<notificationsNotificationExportServiceApi.ScheduleNotificationExportRequest, notificationsNotificationExportServiceApi.ScheduleNotificationExportResponse>(
    (request) => this.workflow.scheduleNotificationExport(request),
  );

  /**
   * Shares a notification.
   */
  shareNotificationExport = unary<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse>(
    (request) => this.workflow.shareNotificationExport(request),
  );

  /**
   * Streams every matching notification.
   */
  streamNotificationExport = serverStream<notificationsNotificationExportServiceApi.StreamNotificationExportRequest, notificationsNotificationExportServiceApi.StreamNotificationExportResponse>(
    (request) => this.workflow.streamNotificationExport(request),
  );
}

export function implementation(handler: NotificationExportHandler): notificationsNotificationExportServiceApi.NotificationExportServiceServer {
  return {
    cancelNotificationExport: handler.cancelNotificationExport,
    getNotificationExport: handler.getNotificationExport,
    listNotificationExports: handler.listNotificationExports,
    retryNotificationExport: handler.retryNotificationExport,
    scheduleNotificationExport: handler.scheduleNotificationExport,
    shareNotificationExport: handler.shareNotificationExport,
    streamNotificationExport: handler.streamNotificationExport,
  };
}
