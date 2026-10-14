/**
 * Keeps notification templates in step with the systems of record in other regions.
 */

import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { NotificationTemplateSyncWorkflow } from "../application/notification-template-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationTemplateSyncService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateSyncHandler {
  constructor(@inject(NotificationTemplateSyncWorkflow) private readonly workflow: NotificationTemplateSyncWorkflow) {}

  /**
   * Lists notification templates a page at a time.
   */
  listNotificationTemplateConflicts = (call: ServerUnaryCall<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest, notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse>, done: sendUnaryData<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse>): void => {
    void this.workflow.listNotificationTemplateConflicts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls a notification template.
   */
  pullNotificationTemplates = unary<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse>(
    (request) => this.workflow.pullNotificationTemplates(request),
  );

  /**
   * Pushs a notification template.
   */
  pushNotificationTemplate = unary<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest, notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse>(
    (request) => this.workflow.pushNotificationTemplate(request),
  );

  /**
   * Reconciles a notification template.
   */
  reconcileNotificationTemplates = (call: ServerUnaryCall<notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesResponse>, done: sendUnaryData<notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesResponse>): void => {
    void this.workflow.reconcileNotificationTemplates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves a notification template.
   */
  resolveNotificationTemplateConflict = unary<notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictRequest, notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictResponse>(
    (request) => this.workflow.resolveNotificationTemplateConflict(request),
  );

  /**
   * Syncs a notification template.
   */
  syncNotificationTemplates = unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse>(
    (request) => this.workflow.syncNotificationTemplates(request),
  );
}

export function implementation(handler: NotificationTemplateSyncHandler): notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceServer {
  return {
    listNotificationTemplateConflicts: handler.listNotificationTemplateConflicts,
    pullNotificationTemplates: handler.pullNotificationTemplates,
    pushNotificationTemplate: handler.pushNotificationTemplate,
    reconcileNotificationTemplates: handler.reconcileNotificationTemplates,
    resolveNotificationTemplateConflict: handler.resolveNotificationTemplateConflict,
    syncNotificationTemplates: handler.syncNotificationTemplates,
  };
}
