/**
 * Tells the people who follow a notification what changed.
 */

import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { NotificationNotificationWorkflow } from "./notification-notification.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationNotificationHandler {
  constructor(@inject(NotificationNotificationWorkflow) private readonly workflow: NotificationNotificationWorkflow) {}

  /**
   * Returns a notification.
   */
  getNotificationPreferences = unary<notificationsNotificationNotificationServiceApi.GetNotificationPreferencesRequest, notificationsNotificationNotificationServiceApi.GetNotificationPreferencesResponse>(
    (request) => this.workflow.getNotificationPreferences(request),
  );

  /**
   * Lists notifications a page at a time.
   */
  listNotificationSubscriptions = (call: ServerUnaryCall<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>, done: sendUnaryData<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>): void => {
    void this.workflow.listNotificationSubscriptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Notifys a notification.
   */
  notifyNotificationWatchers = unary<notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest, notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse>(
    (request) => this.workflow.notifyNotificationWatchers(request),
  );

  /**
   * Streams the changes of notifications as they happen.
   */
  streamNotificationNotices = serverStream<notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest, notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse>(
    (request) => this.workflow.streamNotificationNotices(request),
  );

  /**
   * Subscribes a notification.
   */
  subscribeNotificationUpdates = (call: ServerUnaryCall<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>, done: sendUnaryData<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>): void => {
    void this.workflow.subscribeNotificationUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Unsubscribes a notification.
   */
  unsubscribeNotificationUpdates = unary<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>(
    (request) => this.workflow.unsubscribeNotificationUpdates(request),
  );
}

export function implementation(handler: NotificationNotificationHandler): notificationsNotificationNotificationServiceApi.NotificationNotificationServiceServer {
  return {
    getNotificationPreferences: handler.getNotificationPreferences,
    listNotificationSubscriptions: handler.listNotificationSubscriptions,
    notifyNotificationWatchers: handler.notifyNotificationWatchers,
    streamNotificationNotices: handler.streamNotificationNotices,
    subscribeNotificationUpdates: handler.subscribeNotificationUpdates,
    unsubscribeNotificationUpdates: handler.unsubscribeNotificationUpdates,
  };
}
