/**
 * Tells the people who follow a subscription what changed.
 */

import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { SubscriptionNotificationWorkflow } from "./subscription-notification.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SubscriptionNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionNotificationHandler {
  constructor(@inject(SubscriptionNotificationWorkflow) private readonly workflow: SubscriptionNotificationWorkflow) {}

  /**
   * Returns a subscription.
   */
  getSubscriptionPreferences = unary<notificationsSubscriptionNotificationServiceApi.GetSubscriptionPreferencesRequest, notificationsSubscriptionNotificationServiceApi.GetSubscriptionPreferencesResponse>(
    (request) => this.workflow.getSubscriptionPreferences(request),
  );

  /**
   * Lists subscriptions a page at a time.
   */
  listSubscriptionSubscriptions = (call: ServerUnaryCall<notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsRequest, notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse>, done: sendUnaryData<notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse>): void => {
    void this.workflow.listSubscriptionSubscriptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Notifys a subscription.
   */
  notifySubscriptionWatchers = unary<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse>(
    (request) => this.workflow.notifySubscriptionWatchers(request),
  );

  /**
   * Sends a subscription.
   */
  sendSubscriptionTestNotice = unary<notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeRequest, notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeResponse>(
    (request) => this.workflow.sendSubscriptionTestNotice(request),
  );

  /**
   * Streams the changes of subscriptions as they happen.
   */
  streamSubscriptionNotices = serverStream<notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesRequest, notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesResponse>(
    (request) => this.workflow.streamSubscriptionNotices(request),
  );

  /**
   * Subscribes a subscription.
   */
  subscribeSubscriptionUpdates = unary<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>(
    (request) => this.workflow.subscribeSubscriptionUpdates(request),
  );

  /**
   * Unsubscribes a subscription.
   */
  unsubscribeSubscriptionUpdates = unary<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse>(
    (request) => this.workflow.unsubscribeSubscriptionUpdates(request),
  );
}

export function implementation(handler: SubscriptionNotificationHandler): notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceServer {
  return {
    getSubscriptionPreferences: handler.getSubscriptionPreferences,
    listSubscriptionSubscriptions: handler.listSubscriptionSubscriptions,
    notifySubscriptionWatchers: handler.notifySubscriptionWatchers,
    sendSubscriptionTestNotice: handler.sendSubscriptionTestNotice,
    streamSubscriptionNotices: handler.streamSubscriptionNotices,
    subscribeSubscriptionUpdates: handler.subscribeSubscriptionUpdates,
    unsubscribeSubscriptionUpdates: handler.unsubscribeSubscriptionUpdates,
  };
}
