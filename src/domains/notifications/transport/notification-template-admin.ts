/**
 * Operator actions on notification templates that support staff run by hand.
 */

import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { NotificationTemplateAdminWorkflow } from "../application/notification-template-admin.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationTemplateAdminService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateAdminHandler {
  constructor(@inject(NotificationTemplateAdminWorkflow) private readonly workflow: NotificationTemplateAdminWorkflow) {}

  /**
   * Archives a notification template.
   */
  archiveNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse>): void => {
    void this.workflow.archiveNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Locks a notification template.
   */
  lockNotificationTemplate = unary<notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateResponse>(
    (request) => this.workflow.lockNotificationTemplate(request),
  );

  /**
   * Deletes a notification template.
   */
  purgeNotificationTemplate = unary<notificationsNotificationTemplateAdminServiceApi.PurgeNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.PurgeNotificationTemplateResponse>(
    (request) => this.workflow.purgeNotificationTemplate(request),
  );

  /**
   * Reassigns a notification template.
   */
  reassignNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse>): void => {
    void this.workflow.reassignNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Repairs a notification template.
   */
  repairNotificationTemplate = unary<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse>(
    (request) => this.workflow.repairNotificationTemplate(request),
  );

  /**
   * Restores a notification template.
   */
  restoreNotificationTemplate = unary<notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateResponse>(
    (request) => this.workflow.restoreNotificationTemplate(request),
  );

  /**
   * Transfers a notification template.
   */
  transferNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateResponse>): void => {
    void this.workflow.transferNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Unlocks a notification template.
   */
  unlockNotificationTemplate = unary<notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateResponse>(
    (request) => this.workflow.unlockNotificationTemplate(request),
  );
}

export function implementation(handler: NotificationTemplateAdminHandler): notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceServer {
  return {
    archiveNotificationTemplate: handler.archiveNotificationTemplate,
    lockNotificationTemplate: handler.lockNotificationTemplate,
    purgeNotificationTemplate: handler.purgeNotificationTemplate,
    reassignNotificationTemplate: handler.reassignNotificationTemplate,
    repairNotificationTemplate: handler.repairNotificationTemplate,
    restoreNotificationTemplate: handler.restoreNotificationTemplate,
    transferNotificationTemplate: handler.transferNotificationTemplate,
    unlockNotificationTemplate: handler.unlockNotificationTemplate,
  };
}
