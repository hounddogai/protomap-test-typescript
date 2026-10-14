/**
 * Tells the people who follow a notification what changed. Remote work stays behind typed client ports.
 */

import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationNotificationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a notification.
   */
  async getNotificationPreferences(req: notificationsNotificationNotificationServiceApi.GetNotificationPreferencesRequest): Promise<notificationsNotificationNotificationServiceApi.GetNotificationPreferencesResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationPreferences", req);
    this.logger.info("get_notification_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationNotificationServiceApi.GetNotificationPreferencesResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Lists notifications a page at a time.
   */
  async listNotificationSubscriptions(req: notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest): Promise<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationSubscriptions", req);
    this.logger.info("list_notification_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse.fromPartial({});
  }

  /**
   * Notifys a notification.
   */
  async notifyNotificationWatchers(req: notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest): Promise<notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyNotificationWatchers", req);
    this.logger.info("notify_notification_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse.fromPartial({
      notification: {
        assignee: { email: (req?.details?.recipient?.email ?? "") },
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Streams the changes of notifications as they happen.
   */
  async streamNotificationNotices(req: notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest): Promise<notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamNotificationNotices", req);
    this.logger.info("stream_notification_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.subscriber?.email ?? "") });
    return notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({
      notification: {
        requester: {
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
  }

  /**
   * Subscribes a notification.
   */
  async subscribeNotificationUpdates(req: notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest): Promise<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeNotificationUpdates", req);
    this.logger.info("subscribe_notification_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (req?.notificationId ?? ""),
      },
    });
    const cloned1: notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse.fromPartial({
        notification: {
          notificationId: (req?.notificationId ?? ""),
          requester: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }

  /**
   * Unsubscribes a notification.
   */
  async unsubscribeNotificationUpdates(req: notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest): Promise<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeNotificationUpdates", req);
    this.logger.info("unsubscribe_notification_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: { counterparty: { notificationId: (req?.notificationId ?? "") } },
    });
    const decoded1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse.fromPartial({
        notification: {
          notificationId: (req?.notificationId ?? ""),
          requester: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }
}
