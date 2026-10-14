/**
 * Keeps every version of a notification template and restores earlier ones.
 */

import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { NotificationTemplateHistoryWorkflow } from "../application/notification-template-history.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationTemplateHistoryService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateHistoryHandler {
  constructor(@inject(NotificationTemplateHistoryWorkflow) private readonly workflow: NotificationTemplateHistoryWorkflow) {}

  /**
   * Annotates a notification template.
   */
  annotateNotificationTemplateVersion = (call: ServerUnaryCall<notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse>, done: sendUnaryData<notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse>): void => {
    void this.workflow.annotateNotificationTemplateVersion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a notification template.
   */
  compareNotificationTemplateVersions = unary<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse>(
    (request) => this.workflow.compareNotificationTemplateVersions(request),
  );

  /**
   * Lists notification templates a page at a time.
   */
  listNotificationTemplateVersions = unary<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse>(
    (request) => this.workflow.listNotificationTemplateVersions(request),
  );

  /**
   * Deletes a notification template.
   */
  pruneNotificationTemplateVersions = (call: ServerUnaryCall<notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsResponse>, done: sendUnaryData<notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsResponse>): void => {
    void this.workflow.pruneNotificationTemplateVersions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Records a notification template.
   */
  recordNotificationTemplateVersion = unary<notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionResponse>(
    (request) => this.workflow.recordNotificationTemplateVersion(request),
  );

  /**
   * Reverts a notification template.
   */
  revertNotificationTemplate = unary<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest, notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse>(
    (request) => this.workflow.revertNotificationTemplate(request),
  );
}

export function implementation(handler: NotificationTemplateHistoryHandler): notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceServer {
  return {
    annotateNotificationTemplateVersion: handler.annotateNotificationTemplateVersion,
    compareNotificationTemplateVersions: handler.compareNotificationTemplateVersions,
    listNotificationTemplateVersions: handler.listNotificationTemplateVersions,
    pruneNotificationTemplateVersions: handler.pruneNotificationTemplateVersions,
    recordNotificationTemplateVersion: handler.recordNotificationTemplateVersion,
    revertNotificationTemplate: handler.revertNotificationTemplate,
  };
}
