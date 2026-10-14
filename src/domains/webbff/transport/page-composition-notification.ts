/**
 * Tells the people who follow a page composition what changed.
 */

import * as webbffPageCompositionNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { PageCompositionNotificationWorkflow } from "../application/page-composition-notification.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PageCompositionNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class PageCompositionNotificationHandler {
  constructor(@inject(PageCompositionNotificationWorkflow) private readonly workflow: PageCompositionNotificationWorkflow) {}

  /**
   * Returns a page composition.
   */
  getPageCompositionPreferences = (call: ServerUnaryCall<webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesRequest, webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse>, done: sendUnaryData<webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse>): void => {
    void this.workflow.getPageCompositionPreferences(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists page compositions a page at a time.
   */
  listPageCompositionSubscriptions = unary<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse>(
    (request) => this.workflow.listPageCompositionSubscriptions(request),
  );

  /**
   * Notifys a page composition.
   */
  notifyPageCompositionWatchers = unary<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>(
    (request) => this.workflow.notifyPageCompositionWatchers(request),
  );

  /**
   * Sends a page composition.
   */
  sendPageCompositionTestNotice = (call: ServerUnaryCall<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest, webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse>, done: sendUnaryData<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse>): void => {
    void this.workflow.sendPageCompositionTestNotice(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of page compositions as they happen.
   */
  streamPageCompositionNotices = serverStream<webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesRequest, webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse>(
    (request) => this.workflow.streamPageCompositionNotices(request),
  );

  /**
   * Subscribes a page composition.
   */
  subscribePageCompositionUpdates = unary<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(
    (request) => this.workflow.subscribePageCompositionUpdates(request),
  );

  /**
   * Unsubscribes a page composition.
   */
  unsubscribePageCompositionUpdates = (call: ServerUnaryCall<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>, done: sendUnaryData<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>): void => {
    void this.workflow.unsubscribePageCompositionUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: PageCompositionNotificationHandler): webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceServer {
  return {
    getPageCompositionPreferences: handler.getPageCompositionPreferences,
    listPageCompositionSubscriptions: handler.listPageCompositionSubscriptions,
    notifyPageCompositionWatchers: handler.notifyPageCompositionWatchers,
    sendPageCompositionTestNotice: handler.sendPageCompositionTestNotice,
    streamPageCompositionNotices: handler.streamPageCompositionNotices,
    subscribePageCompositionUpdates: handler.subscribePageCompositionUpdates,
    unsubscribePageCompositionUpdates: handler.unsubscribePageCompositionUpdates,
  };
}
