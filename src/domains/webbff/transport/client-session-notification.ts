/**
 * Tells the people who follow a client session what changed.
 */

import * as webbffClientSessionNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { ClientSessionNotificationWorkflow } from "../application/client-session-notification.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ClientSessionNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class ClientSessionNotificationHandler {
  constructor(@inject(ClientSessionNotificationWorkflow) private readonly workflow: ClientSessionNotificationWorkflow) {}

  /**
   * Returns a client session.
   */
  getClientSessionPreferences = (call: ServerUnaryCall<webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesRequest, webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse>, done: sendUnaryData<webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse>): void => {
    void this.workflow.getClientSessionPreferences(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists client sessions a page at a time.
   */
  listClientSessionSubscriptions = unary<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest, webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse>(
    (request) => this.workflow.listClientSessionSubscriptions(request),
  );

  /**
   * Notifys a client session.
   */
  notifyClientSessionWatchers = unary<webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest, webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse>(
    (request) => this.workflow.notifyClientSessionWatchers(request),
  );

  /**
   * Sends a client session.
   */
  sendClientSessionTestNotice = (call: ServerUnaryCall<webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeRequest, webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse>, done: sendUnaryData<webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse>): void => {
    void this.workflow.sendClientSessionTestNotice(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of client sessions as they happen.
   */
  streamClientSessionNotices = serverStream<webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesRequest, webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse>(
    (request) => this.workflow.streamClientSessionNotices(request),
  );

  /**
   * Subscribes a client session.
   */
  subscribeClientSessionUpdates = unary<webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesRequest, webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse>(
    (request) => this.workflow.subscribeClientSessionUpdates(request),
  );

  /**
   * Unsubscribes a client session.
   */
  unsubscribeClientSessionUpdates = (call: ServerUnaryCall<webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesRequest, webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse>, done: sendUnaryData<webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse>): void => {
    void this.workflow.unsubscribeClientSessionUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ClientSessionNotificationHandler): webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceServer {
  return {
    getClientSessionPreferences: handler.getClientSessionPreferences,
    listClientSessionSubscriptions: handler.listClientSessionSubscriptions,
    notifyClientSessionWatchers: handler.notifyClientSessionWatchers,
    sendClientSessionTestNotice: handler.sendClientSessionTestNotice,
    streamClientSessionNotices: handler.streamClientSessionNotices,
    subscribeClientSessionUpdates: handler.subscribeClientSessionUpdates,
    unsubscribeClientSessionUpdates: handler.unsubscribeClientSessionUpdates,
  };
}
