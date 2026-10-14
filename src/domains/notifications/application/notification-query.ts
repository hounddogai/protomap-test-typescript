/**
 * Answers read-only questions about notifications, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationQueryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists notifications a page at a time.
   */
  async browseNotifications(req: notificationsNotificationQueryServiceApi.BrowseNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.BrowseNotificationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseNotifications", req);
    this.logger.info("browse_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.ScoreVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.venues.v1.ScoreVenueRequest",
      value: Buffer.from(venuesVenueValidationServiceApi.ScoreVenueRequest.encode(request1).finish()),
    });
    const unpacked1 = venuesVenueValidationServiceApi.ScoreVenueRequest.decode(envelope1.value);
    const invoke1: Unary<venuesVenueValidationServiceApi.ScoreVenueRequest, venuesVenueValidationServiceApi.ScoreVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.scoreVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueValidationServiceApi.ScoreVenueRequest, venuesVenueValidationServiceApi.ScoreVenueResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationQueryServiceApi.BrowseNotificationsResponse.fromPartial({
      notifications: [{ audit: { updatedAt: reply1?.venue?.audit?.updatedAt } }],
    });
  }

  /**
   * Counts notifications by status.
   */
  async countNotifications(req: notificationsNotificationQueryServiceApi.CountNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.CountNotificationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountNotifications", req);
    this.logger.info("count_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationQueryServiceApi.CountNotificationsResponse.fromPartial({});
  }

  /**
   * Streams every matching notification.
   */
  async exportNotifications(req: notificationsNotificationQueryServiceApi.ExportNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.ExportNotificationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportNotifications", req);
    this.logger.info("export_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return notificationsNotificationQueryServiceApi.ExportNotificationsResponse.fromPartial({});
  }

  /**
   * Lists notifications a page at a time.
   */
  async findNotifications(req: notificationsNotificationQueryServiceApi.FindNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.FindNotificationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindNotifications", req);
    this.logger.info("find_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationQueryServiceApi.FindNotificationsResponse.fromPartial({});
  }

  /**
   * Returns a notification.
   */
  async lookupNotification(req: notificationsNotificationQueryServiceApi.LookupNotificationRequest): Promise<notificationsNotificationQueryServiceApi.LookupNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupNotification", req);
    this.logger.info("lookup_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationQueryServiceApi.LookupNotificationResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Returns a notification.
   */
  async peekNotification(req: notificationsNotificationQueryServiceApi.PeekNotificationRequest): Promise<notificationsNotificationQueryServiceApi.PeekNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekNotification", req);
    this.logger.info("peek_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.notificationsNotificationTemplateNotificationClient.streamNotificationTemplateNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse.fromPartial({});
    return notificationsNotificationQueryServiceApi.PeekNotificationResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Returns several notifications at once.
   */
  async resolveNotifications(req: notificationsNotificationQueryServiceApi.ResolveNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveNotifications", req);
    this.logger.info("resolve_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationQueryServiceApi.ResolveNotificationsResponse.fromPartial({});
  }

  /**
   * Summarizes a notification.
   */
  async summarizeNotifications(req: notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest): Promise<notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeNotifications", req);
    this.logger.info("summarize_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse.fromPartial({ period: req?.details?.period });
  }
}
