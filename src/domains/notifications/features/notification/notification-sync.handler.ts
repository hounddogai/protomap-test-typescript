/**
 * Keeps notifications in step with the systems of record in other regions.
 */

import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { duplex, unary } from "../../../../platform/handlers.js";
import { NotificationSyncWorkflow } from "./notification-sync.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationSyncService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationSyncHandler {
  constructor(@inject(NotificationSyncWorkflow) private readonly workflow: NotificationSyncWorkflow) {}

  /**
   * Returns a notification.
   */
  getNotificationSyncState = unary<notificationsNotificationSyncServiceApi.GetNotificationSyncStateRequest, notificationsNotificationSyncServiceApi.GetNotificationSyncStateResponse>(
    (request) => this.workflow.getNotificationSyncState(request),
  );

  /**
   * Lists notifications a page at a time.
   */
  listNotificationConflicts = (call: ServerUnaryCall<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>, done: sendUnaryData<notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>): void => {
    void this.workflow.listNotificationConflicts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls a notification.
   */
  pullNotifications = unary<notificationsNotificationSyncServiceApi.PullNotificationsRequest, notificationsNotificationSyncServiceApi.PullNotificationsResponse>(
    (request) => this.workflow.pullNotifications(request),
  );

  /**
   * Pushs a notification.
   */
  pushNotification = unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(
    (request) => this.workflow.pushNotification(request),
  );

  /**
   * Reconciles a notification.
   */
  reconcileNotifications = (call: ServerUnaryCall<notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest, notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse>, done: sendUnaryData<notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse>): void => {
    void this.workflow.reconcileNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves a notification.
   */
  resolveNotificationConflict = unary<notificationsNotificationSyncServiceApi.ResolveNotificationConflictRequest, notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse>(
    (request) => this.workflow.resolveNotificationConflict(request),
  );

  /**
   * Exchanges changes of notifications with a peer.
   */
  streamNotificationChanges = duplex<notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest, notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse>(
    (request) => this.workflow.streamNotificationChanges(request),
  );

  /**
   * Syncs a notification.
   */
  syncNotifications = (call: ServerUnaryCall<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse>, done: sendUnaryData<notificationsNotificationSyncServiceApi.SyncNotificationsResponse>): void => {
    void this.workflow.syncNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: NotificationSyncHandler): notificationsNotificationSyncServiceApi.NotificationSyncServiceServer {
  return {
    getNotificationSyncState: handler.getNotificationSyncState,
    listNotificationConflicts: handler.listNotificationConflicts,
    pullNotifications: handler.pullNotifications,
    pushNotification: handler.pushNotification,
    reconcileNotifications: handler.reconcileNotifications,
    resolveNotificationConflict: handler.resolveNotificationConflict,
    streamNotificationChanges: handler.streamNotificationChanges,
    syncNotifications: handler.syncNotifications,
  };
}
