/**
 * Exports notification templates to files and other systems. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateExportWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a notification template.
   */
  async cancelNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelNotificationTemplateExport", req);
    this.logger.info("cancel_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Returns a notification template.
   */
  async getNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationTemplateExport", req);
    this.logger.info("get_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationTemplateExportServiceApi.GetNotificationTemplateExportResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Lists notification templates a page at a time.
   */
  async listNotificationTemplateExports(req: notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest): Promise<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationTemplateExports", req);
    this.logger.info("list_notification_template_exports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse.fromPartial({});
  }

  /**
   * Retrys a notification template.
   */
  async retryNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "RetryNotificationTemplateExport", req);
    this.logger.info("retry_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        status: req?.notificationTemplate?.status,
      },
    });
  }

  /**
   * Schedules a notification template.
   */
  async scheduleNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleNotificationTemplateExport", req);
    this.logger.info("schedule_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse.fromPartial({ period: req?.details?.period });
  }

  /**
   * Shares a notification template.
   */
  async shareNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareNotificationTemplateExport", req);
    this.logger.info("share_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Streams every matching notification template.
   */
  async streamNotificationTemplateExport(req: notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest): Promise<notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamNotificationTemplateExport", req);
    this.logger.info("stream_notification_template_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest.fromPartial({
      accessPolicy: { owner: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest, authorizationAccessPolicyServiceApi.CreateAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyClient.createAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest, authorizationAccessPolicyServiceApi.CreateAccessPolicyResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({
        notificationTemplate: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }
}
