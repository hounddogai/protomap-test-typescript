/**
 * Operator actions on notifications that support staff run by hand. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationAdminWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Archives a notification.
   */
  async archiveNotification(req: notificationsNotificationAdminServiceApi.ArchiveNotificationRequest): Promise<notificationsNotificationAdminServiceApi.ArchiveNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "ArchiveNotification", req);
    this.logger.info("archive_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.ArchiveNotificationResponse.fromPartial({
      notification: { notificationId: (req?.notificationId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Returns a notification.
   */
  async inspectNotification(req: notificationsNotificationAdminServiceApi.InspectNotificationRequest): Promise<notificationsNotificationAdminServiceApi.InspectNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectNotification", req);
    this.logger.info("inspect_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationAdminServiceApi.InspectNotificationResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Deletes a notification.
   */
  async purgeNotification(req: notificationsNotificationAdminServiceApi.PurgeNotificationRequest): Promise<notificationsNotificationAdminServiceApi.PurgeNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "PurgeNotification", req);
    this.logger.info("purge_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsNotificationAdminServiceApi.PurgeNotificationResponse.fromPartial({});
  }

  /**
   * Reassigns a notification.
   */
  async reassignNotification(req: notificationsNotificationAdminServiceApi.ReassignNotificationRequest): Promise<notificationsNotificationAdminServiceApi.ReassignNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReassignNotification", req);
    this.logger.info("reassign_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.ReassignNotificationResponse.fromPartial({
      notification: {
        assignee: req?.details?.assignee,
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Repairs a notification.
   */
  async repairNotification(req: notificationsNotificationAdminServiceApi.RepairNotificationRequest): Promise<notificationsNotificationAdminServiceApi.RepairNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "RepairNotification", req);
    this.logger.info("repair_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>> = [];
    for (const item of (req?.notification?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest.fromPartial({
          context: req?.context,
          details: {
            notify: {
              email: (item?.authorEmail ?? ""),
              phone: (req?.notification?.requester?.phone ?? ""),
            },
          },
          subscription: {
            audit: { createdAt: item?.createdAt },
            owner: { userId: (req?.notification?.assignee?.userId ?? "") },
          },
        });
        const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> =
          (input, done) => this.notificationsSubscriptionWorkflowClient.pauseSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.RepairNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        priority: (req?.notification?.priority ?? 0),
      },
    });
  }

  /**
   * Restores a notification.
   */
  async restoreNotification(req: notificationsNotificationAdminServiceApi.RestoreNotificationRequest): Promise<notificationsNotificationAdminServiceApi.RestoreNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "RestoreNotification", req);
    this.logger.info("restore_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.RestoreNotificationResponse.fromPartial({
      notification: { notificationId: (req?.notificationId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Transfers a notification.
   */
  async transferNotification(req: notificationsNotificationAdminServiceApi.TransferNotificationRequest): Promise<notificationsNotificationAdminServiceApi.TransferNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "TransferNotification", req);
    this.logger.info("transfer_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.TransferNotificationResponse.fromPartial({
      notification: { notificationId: (req?.notificationId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Unlocks a notification.
   */
  async unlockNotification(req: notificationsNotificationAdminServiceApi.UnlockNotificationRequest): Promise<notificationsNotificationAdminServiceApi.UnlockNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "UnlockNotification", req);
    this.logger.info("unlock_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationAdminServiceApi.UnlockNotificationResponse.fromPartial({
      notification: { notificationId: (req?.notificationId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }
}

/**
 * The gRPC boundary for NotificationAdminService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationAdminHandler {
  constructor(@inject(NotificationAdminWorkflow) private readonly workflow: NotificationAdminWorkflow) {}

  /**
   * Archives a notification.
   */
  archiveNotification = unary<notificationsNotificationAdminServiceApi.ArchiveNotificationRequest, notificationsNotificationAdminServiceApi.ArchiveNotificationResponse>(
    (request) => this.workflow.archiveNotification(request),
  );

  /**
   * Returns a notification.
   */
  inspectNotification = unary<notificationsNotificationAdminServiceApi.InspectNotificationRequest, notificationsNotificationAdminServiceApi.InspectNotificationResponse>(
    (request) => this.workflow.inspectNotification(request),
  );

  /**
   * Deletes a notification.
   */
  purgeNotification = (call: ServerUnaryCall<notificationsNotificationAdminServiceApi.PurgeNotificationRequest, notificationsNotificationAdminServiceApi.PurgeNotificationResponse>, done: sendUnaryData<notificationsNotificationAdminServiceApi.PurgeNotificationResponse>): void => {
    void this.workflow.purgeNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reassigns a notification.
   */
  reassignNotification = unary<notificationsNotificationAdminServiceApi.ReassignNotificationRequest, notificationsNotificationAdminServiceApi.ReassignNotificationResponse>(
    (request) => this.workflow.reassignNotification(request),
  );

  /**
   * Repairs a notification.
   */
  repairNotification = unary<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse>(
    (request) => this.workflow.repairNotification(request),
  );

  /**
   * Restores a notification.
   */
  restoreNotification = (call: ServerUnaryCall<notificationsNotificationAdminServiceApi.RestoreNotificationRequest, notificationsNotificationAdminServiceApi.RestoreNotificationResponse>, done: sendUnaryData<notificationsNotificationAdminServiceApi.RestoreNotificationResponse>): void => {
    void this.workflow.restoreNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Transfers a notification.
   */
  transferNotification = unary<notificationsNotificationAdminServiceApi.TransferNotificationRequest, notificationsNotificationAdminServiceApi.TransferNotificationResponse>(
    (request) => this.workflow.transferNotification(request),
  );

  /**
   * Unlocks a notification.
   */
  unlockNotification = unary<notificationsNotificationAdminServiceApi.UnlockNotificationRequest, notificationsNotificationAdminServiceApi.UnlockNotificationResponse>(
    (request) => this.workflow.unlockNotification(request),
  );
}

export function implementation(handler: NotificationAdminHandler): notificationsNotificationAdminServiceApi.NotificationAdminServiceServer {
  return {
    archiveNotification: handler.archiveNotification,
    inspectNotification: handler.inspectNotification,
    purgeNotification: handler.purgeNotification,
    reassignNotification: handler.reassignNotification,
    repairNotification: handler.repairNotification,
    restoreNotification: handler.restoreNotification,
    transferNotification: handler.transferNotification,
    unlockNotification: handler.unlockNotification,
  };
}
