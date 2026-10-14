/**
 * Exports notifications to files and other systems. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationExportWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a notification.
   */
  async cancelNotificationExport(req: notificationsNotificationExportServiceApi.CancelNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.CancelNotificationExportResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelNotificationExport", req);
    this.logger.info("cancel_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationExportServiceApi.CancelNotificationExportResponse.fromPartial({
      notification: { notificationId: (req?.notificationId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Returns a notification.
   */
  async getNotificationExport(req: notificationsNotificationExportServiceApi.GetNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.GetNotificationExportResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationExport", req);
    this.logger.info("get_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationExportServiceApi.GetNotificationExportResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Lists notifications a page at a time.
   */
  async listNotificationExports(req: notificationsNotificationExportServiceApi.ListNotificationExportsRequest): Promise<notificationsNotificationExportServiceApi.ListNotificationExportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationExports", req);
    this.logger.info("list_notification_exports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationExportServiceApi.ListNotificationExportsResponse.fromPartial({});
  }

  /**
   * Retrys a notification.
   */
  async retryNotificationExport(req: notificationsNotificationExportServiceApi.RetryNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.RetryNotificationExportResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "RetryNotificationExport", req);
    this.logger.info("retry_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationExportServiceApi.RetryNotificationExportResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        priority: (req?.notification?.priority ?? 0),
      },
    });
  }

  /**
   * Schedules a notification.
   */
  async scheduleNotificationExport(req: notificationsNotificationExportServiceApi.ScheduleNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.ScheduleNotificationExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleNotificationExport", req);
    this.logger.info("schedule_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationExportServiceApi.ScheduleNotificationExportResponse.fromPartial({ period: req?.details?.period });
  }

  /**
   * Shares a notification.
   */
  async shareNotificationExport(req: notificationsNotificationExportServiceApi.ShareNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.ShareNotificationExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareNotificationExport", req);
    this.logger.info("share_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationExportServiceApi.ShareNotificationExportResponse.fromPartial({
      notification: {
        assignee: { email: (req?.details?.recipient?.email ?? "") },
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Streams every matching notification.
   */
  async streamNotificationExport(req: notificationsNotificationExportServiceApi.StreamNotificationExportRequest): Promise<notificationsNotificationExportServiceApi.StreamNotificationExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamNotificationExport", req);
    this.logger.info("stream_notification_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return notificationsNotificationExportServiceApi.StreamNotificationExportResponse.fromPartial({});
  }
}
