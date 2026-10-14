/**
 * Exports notification templates to files and other systems.
 */

import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { NotificationTemplateExportWorkflow } from "./notification-template-export.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationTemplateExportService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateExportHandler {
  constructor(@inject(NotificationTemplateExportWorkflow) private readonly workflow: NotificationTemplateExportWorkflow) {}

  /**
   * Cancels a notification template.
   */
  cancelNotificationTemplateExport = unary<notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportResponse>(
    (request) => this.workflow.cancelNotificationTemplateExport(request),
  );

  /**
   * Returns a notification template.
   */
  getNotificationTemplateExport = (call: ServerUnaryCall<notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportResponse>, done: sendUnaryData<notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportResponse>): void => {
    void this.workflow.getNotificationTemplateExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists notification templates a page at a time.
   */
  listNotificationTemplateExports = unary<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest, notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse>(
    (request) => this.workflow.listNotificationTemplateExports(request),
  );

  /**
   * Retrys a notification template.
   */
  retryNotificationTemplateExport = unary<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse>(
    (request) => this.workflow.retryNotificationTemplateExport(request),
  );

  /**
   * Schedules a notification template.
   */
  scheduleNotificationTemplateExport = (call: ServerUnaryCall<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>, done: sendUnaryData<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>): void => {
    void this.workflow.scheduleNotificationTemplateExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a notification template.
   */
  shareNotificationTemplateExport = unary<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>(
    (request) => this.workflow.shareNotificationTemplateExport(request),
  );

  /**
   * Streams every matching notification template.
   */
  streamNotificationTemplateExport = serverStream<notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse>(
    (request) => this.workflow.streamNotificationTemplateExport(request),
  );
}

export function implementation(handler: NotificationTemplateExportHandler): notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceServer {
  return {
    cancelNotificationTemplateExport: handler.cancelNotificationTemplateExport,
    getNotificationTemplateExport: handler.getNotificationTemplateExport,
    listNotificationTemplateExports: handler.listNotificationTemplateExports,
    retryNotificationTemplateExport: handler.retryNotificationTemplateExport,
    scheduleNotificationTemplateExport: handler.scheduleNotificationTemplateExport,
    shareNotificationTemplateExport: handler.shareNotificationTemplateExport,
    streamNotificationTemplateExport: handler.streamNotificationTemplateExport,
  };
}
