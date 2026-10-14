/**
 * Tells the people who follow a subscription what changed. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionNotificationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a subscription.
   */
  async getSubscriptionPreferences(req: notificationsSubscriptionNotificationServiceApi.GetSubscriptionPreferencesRequest): Promise<notificationsSubscriptionNotificationServiceApi.GetSubscriptionPreferencesResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionPreferences", req);
    this.logger.info("get_subscription_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionNotificationServiceApi.GetSubscriptionPreferencesResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listSubscriptionSubscriptions(req: notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsRequest): Promise<notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSubscriptionSubscriptions", req);
    this.logger.info("list_subscription_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.filter?.region ?? "") },
    });
    const invoke1: Unary<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.listNotificationConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse.fromPartial({
      pageInfo: {
        nextPageToken: (reply1?.pageInfo?.nextPageToken ?? ""),
        totalSize: (reply1?.pageInfo?.totalSize ?? 0),
      },
    });
  }

  /**
   * Notifys a subscription.
   */
  async notifySubscriptionWatchers(req: notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest): Promise<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifySubscriptionWatchers", req);
    this.logger.info("notify_subscription_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse.fromPartial({
      subscription: {
        owner: { email: (req?.details?.recipient?.email ?? "") },
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Sends a subscription.
   */
  async sendSubscriptionTestNotice(req: notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeRequest): Promise<notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SendSubscriptionTestNotice", req);
    this.logger.info("send_subscription_test_notice", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeResponse.fromPartial({
      subscription: {
        owner: { email: (req?.details?.recipient?.email ?? "") },
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Streams the changes of subscriptions as they happen.
   */
  async streamSubscriptionNotices(req: notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesRequest): Promise<notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamSubscriptionNotices", req);
    this.logger.info("stream_subscription_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesResponse.fromPartial({ subscription: { owner: { email: (req?.subscriber?.email ?? "") } } });
  }

  /**
   * Subscribes a subscription.
   */
  async subscribeSubscriptionUpdates(req: notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest): Promise<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeSubscriptionUpdates", req);
    this.logger.info("subscribe_subscription_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse.fromPartial({
      subscription: {
        owner: { email: (req?.details?.recipient?.email ?? "") },
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Unsubscribes a subscription.
   */
  async unsubscribeSubscriptionUpdates(req: notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest): Promise<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeSubscriptionUpdates", req);
    this.logger.info("unsubscribe_subscription_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionExportServiceApi.StreamSubscriptionExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (req?.details?.templateId ?? ""),
      },
    });
    const stream1 = this.notificationsSubscriptionExportClient.streamSubscriptionExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse.fromPartial({
      subscription: {
        owner: { email: (req?.details?.recipient?.email ?? "") },
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }
}
