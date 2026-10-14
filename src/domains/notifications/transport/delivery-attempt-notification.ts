/**
 * Tells the people who follow a delivery attempt what changed.
 */

import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { DeliveryAttemptNotificationWorkflow } from "../application/delivery-attempt-notification.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptNotificationHandler {
  constructor(@inject(DeliveryAttemptNotificationWorkflow) private readonly workflow: DeliveryAttemptNotificationWorkflow) {}

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptPreferences = (call: ServerUnaryCall<notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesRequest, notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesResponse>, done: sendUnaryData<notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesResponse>): void => {
    void this.workflow.getDeliveryAttemptPreferences(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists delivery attempts a page at a time.
   */
  listDeliveryAttemptSubscriptions = unary<notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest, notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsResponse>(
    (request) => this.workflow.listDeliveryAttemptSubscriptions(request),
  );

  /**
   * Notifys a delivery attempt.
   */
  notifyDeliveryAttemptWatchers = unary<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse>(
    (request) => this.workflow.notifyDeliveryAttemptWatchers(request),
  );

  /**
   * Sends a delivery attempt.
   */
  sendDeliveryAttemptTestNotice = (call: ServerUnaryCall<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse>, done: sendUnaryData<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse>): void => {
    void this.workflow.sendDeliveryAttemptTestNotice(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of delivery attempts as they happen.
   */
  streamDeliveryAttemptNotices = serverStream<notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest, notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse>(
    (request) => this.workflow.streamDeliveryAttemptNotices(request),
  );

  /**
   * Subscribes a delivery attempt.
   */
  subscribeDeliveryAttemptUpdates = unary<notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesResponse>(
    (request) => this.workflow.subscribeDeliveryAttemptUpdates(request),
  );

  /**
   * Unsubscribes a delivery attempt.
   */
  unsubscribeDeliveryAttemptUpdates = (call: ServerUnaryCall<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>, done: sendUnaryData<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>): void => {
    void this.workflow.unsubscribeDeliveryAttemptUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: DeliveryAttemptNotificationHandler): notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceServer {
  return {
    getDeliveryAttemptPreferences: handler.getDeliveryAttemptPreferences,
    listDeliveryAttemptSubscriptions: handler.listDeliveryAttemptSubscriptions,
    notifyDeliveryAttemptWatchers: handler.notifyDeliveryAttemptWatchers,
    sendDeliveryAttemptTestNotice: handler.sendDeliveryAttemptTestNotice,
    streamDeliveryAttemptNotices: handler.streamDeliveryAttemptNotices,
    subscribeDeliveryAttemptUpdates: handler.subscribeDeliveryAttemptUpdates,
    unsubscribeDeliveryAttemptUpdates: handler.unsubscribeDeliveryAttemptUpdates,
  };
}
