/**
 * Tells the people who follow a notification template what changed. Remote work stays behind typed client ports.
 */

import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateNotificationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateAdminService") private readonly notificationsNotificationTemplateAdminClient: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a notification template.
   */
  async getNotificationTemplatePreferences(req: notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationTemplatePreferences", req);
    this.logger.info("get_notification_template_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest.fromPartial({
      context: input1?.context,
      subscription: {
        audit: { createdAt: input1?.context?.deadline },
        owner: {
          email: (input1?.context?.actor?.email ?? ""),
          userId: (input1?.context?.actor?.userId ?? ""),
        },
        scopes: (input1?.context?.actor?.roles ?? []).map((value) => value),
      },
    });
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.estimateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse>(invoke1, request1);
    return mergeResponses(
      notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesResponse.fromPartial({
        notificationTemplate: {
          counterparty: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
        },
      }),
      notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
      }),
    );
  }

  /**
   * Lists notification templates a page at a time.
   */
  async listNotificationTemplateSubscriptions(req: notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationTemplateSubscriptions", req);
    this.logger.info("list_notification_template_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.filter?.createdAfter },
    });
    const cloned1: metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse.fromPartial({
      pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) },
      result: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
  }

  /**
   * Notifys a notification template.
   */
  async notifyNotificationTemplateWatchers(req: notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyNotificationTemplateWatchers", req);
    this.logger.info("notify_notification_template_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: { notifyContact: { email: (req?.details?.recipient?.email ?? "") } },
      notificationTemplateId: (req?.notificationTemplateId ?? ""),
    });
    const decoded1 = notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateAdminClient.archiveNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse.fromPartial({
        notificationTemplate: {
          billingAddress: { lines: (reply1?.notificationTemplate?.billingAddress?.lines ?? []) },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
      }),
    );
  }

  /**
   * Streams the changes of notification templates as they happen.
   */
  async streamNotificationTemplateNotices(req: notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamNotificationTemplateNotices", req);
    this.logger.info("stream_notification_template_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse.fromPartial({
      notificationTemplate: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
  }

  /**
   * Subscribes a notification template.
   */
  async subscribeNotificationTemplateUpdates(req: notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeNotificationTemplateUpdates", req);
    this.logger.info("subscribe_notification_template_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Unsubscribes a notification template.
   */
  async unsubscribeNotificationTemplateUpdates(req: notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesRequest): Promise<notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeNotificationTemplateUpdates", req);
    this.logger.info("unsubscribe_notification_template_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }
}

/**
 * The gRPC boundary for NotificationTemplateNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateNotificationHandler {
  constructor(@inject(NotificationTemplateNotificationWorkflow) private readonly workflow: NotificationTemplateNotificationWorkflow) {}

  /**
   * Returns a notification template.
   */
  getNotificationTemplatePreferences = unary<notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesRequest, notificationsNotificationTemplateNotificationServiceApi.GetNotificationTemplatePreferencesResponse>(
    (request) => this.workflow.getNotificationTemplatePreferences(request),
  );

  /**
   * Lists notification templates a page at a time.
   */
  listNotificationTemplateSubscriptions = unary<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse>(
    (request) => this.workflow.listNotificationTemplateSubscriptions(request),
  );

  /**
   * Notifys a notification template.
   */
  notifyNotificationTemplateWatchers = (call: ServerUnaryCall<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>, done: sendUnaryData<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>): void => {
    void this.workflow.notifyNotificationTemplateWatchers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of notification templates as they happen.
   */
  streamNotificationTemplateNotices = serverStream<notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesRequest, notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse>(
    (request) => this.workflow.streamNotificationTemplateNotices(request),
  );

  /**
   * Subscribes a notification template.
   */
  subscribeNotificationTemplateUpdates = unary<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse>(
    (request) => this.workflow.subscribeNotificationTemplateUpdates(request),
  );

  /**
   * Unsubscribes a notification template.
   */
  unsubscribeNotificationTemplateUpdates = (call: ServerUnaryCall<notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse>, done: sendUnaryData<notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse>): void => {
    void this.workflow.unsubscribeNotificationTemplateUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: NotificationTemplateNotificationHandler): notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceServer {
  return {
    getNotificationTemplatePreferences: handler.getNotificationTemplatePreferences,
    listNotificationTemplateSubscriptions: handler.listNotificationTemplateSubscriptions,
    notifyNotificationTemplateWatchers: handler.notifyNotificationTemplateWatchers,
    streamNotificationTemplateNotices: handler.streamNotificationTemplateNotices,
    subscribeNotificationTemplateUpdates: handler.subscribeNotificationTemplateUpdates,
    unsubscribeNotificationTemplateUpdates: handler.unsubscribeNotificationTemplateUpdates,
  };
}
