/**
 * Tells the people who follow a delivery attempt what changed. Remote work stays behind typed client ports.
 */

import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptNotificationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptPreferences(req: notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptPreferences", req);
    this.logger.info("get_delivery_attempt_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptNotificationServiceApi.GetDeliveryAttemptPreferencesResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Lists delivery attempts a page at a time.
   */
  async listDeliveryAttemptSubscriptions(req: notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListDeliveryAttemptSubscriptions", req);
    this.logger.info("list_delivery_attempt_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsResponse.fromPartial({});
  }

  /**
   * Notifys a delivery attempt.
   */
  async notifyDeliveryAttemptWatchers(req: notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyDeliveryAttemptWatchers", req);
    this.logger.info("notify_delivery_attempt_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          name: req?.details?.recipient?.name,
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse>(
      "acme.notifications.v1.DeliveryAttemptNotificationService/NotifyDeliveryAttemptWatchers:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse.fromPartial({
        deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      }),
    );
  }

  /**
   * Sends a delivery attempt.
   */
  async sendDeliveryAttemptTestNotice(req: notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SendDeliveryAttemptTestNotice", req);
    this.logger.info("send_delivery_attempt_test_notice", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Streams the changes of delivery attempts as they happen.
   */
  async streamDeliveryAttemptNotices(req: notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamDeliveryAttemptNotices", req);
    this.logger.info("stream_delivery_attempt_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
  }

  /**
   * Subscribes a delivery attempt.
   */
  async subscribeDeliveryAttemptUpdates(req: notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeDeliveryAttemptUpdates", req);
    this.logger.info("subscribe_delivery_attempt_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesResponse.fromPartial({
        deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      }),
    );
  }

  /**
   * Unsubscribes a delivery attempt.
   */
  async unsubscribeDeliveryAttemptUpdates(req: notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest): Promise<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeDeliveryAttemptUpdates", req);
    this.logger.info("unsubscribe_delivery_attempt_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.BrowseVenuesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.details?.templateId ?? "") },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.BrowseVenuesRequest, venuesVenueQueryServiceApi.BrowseVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.browseVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<venuesVenueQueryServiceApi.BrowseVenuesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse.fromPartial({
        deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      }),
    );
  }
}
