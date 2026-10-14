/**
 * Keeps notification templates in step with the systems of record in other regions. Remote work stays behind typed
 * client ports.
 */

import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateSyncWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists notification templates a page at a time.
   */
  async listNotificationTemplateConflicts(req: notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest): Promise<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationTemplateConflicts", req);
    this.logger.info("list_notification_template_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse.fromPartial({});
  }

  /**
   * Pulls a notification template.
   */
  async pullNotificationTemplates(req: notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest): Promise<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "PullNotificationTemplates", req);
    this.logger.info("pull_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse.fromPartial({
      notificationTemplate: {
        metadata: (req?.notificationTemplate?.metadata ?? {}),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Pushs a notification template.
   */
  async pushNotificationTemplate(req: notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest): Promise<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "PushNotificationTemplate", req);
    this.logger.info("push_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        status: req?.notificationTemplate?.status,
      },
    });
  }

  /**
   * Reconciles a notification template.
   */
  async reconcileNotificationTemplates(req: notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesRequest): Promise<notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ReconcileNotificationTemplates", req);
    this.logger.info("reconcile_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.ReconcileNotificationTemplatesResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        number: (req?.notificationTemplate?.number ?? ""),
      },
    });
  }

  /**
   * Resolves a notification template.
   */
  async resolveNotificationTemplateConflict(req: notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictRequest): Promise<notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ResolveNotificationTemplateConflict", req);
    this.logger.info("resolve_notification_template_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        total: req?.notificationTemplate?.total,
      },
    });
  }

  /**
   * Syncs a notification template.
   */
  async syncNotificationTemplates(req: notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest): Promise<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "SyncNotificationTemplates", req);
    this.logger.info("sync_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse.fromPartial({
      notificationTemplate: {
        notes: (req?.notificationTemplate?.notes ?? ""),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }
}
