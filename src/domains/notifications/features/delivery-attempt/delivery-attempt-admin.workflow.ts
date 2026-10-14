/**
 * Operator actions on delivery attempts that support staff run by hand. Remote work stays behind typed client ports.
 */

import * as notificationsDeliveryAttemptAdminServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptAdminWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Archives a delivery attempt.
   */
  async archiveDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.ArchiveDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.ArchiveDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "ArchiveDeliveryAttempt", req);
    this.logger.info("archive_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.ArchiveDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Returns a delivery attempt.
   */
  async inspectDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectDeliveryAttempt", req);
    this.logger.info("inspect_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Locks a delivery attempt.
   */
  async lockDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.LockDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.LockDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "LockDeliveryAttempt", req);
    this.logger.info("lock_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.LockDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Reassigns a delivery attempt.
   */
  async reassignDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReassignDeliveryAttempt", req);
    this.logger.info("reassign_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: { displayName: (req?.details?.assignee?.displayName ?? "") },
      },
    });
  }

  /**
   * Repairs a delivery attempt.
   */
  async repairDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RepairDeliveryAttempt", req);
    this.logger.info("repair_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      result: { correlationId: (req?.deliveryAttempt?.correlationId ?? "") },
    });
  }

  /**
   * Restores a delivery attempt.
   */
  async restoreDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.RestoreDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.RestoreDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "RestoreDeliveryAttempt", req);
    this.logger.info("restore_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.RestoreDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Transfers a delivery attempt.
   */
  async transferDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "TransferDeliveryAttempt", req);
    this.logger.info("transfer_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Unlocks a delivery attempt.
   */
  async unlockDeliveryAttempt(req: notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "UnlockDeliveryAttempt", req);
    this.logger.info("unlock_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }
}
