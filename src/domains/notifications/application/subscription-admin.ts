/**
 * Operator actions on subscriptions that support staff run by hand. Remote work stays behind typed client ports.
 */

import * as notificationsSubscriptionAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_admin_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionAdminWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Archives a subscription.
   */
  async archiveSubscription(req: notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "ArchiveSubscription", req);
    this.logger.info("archive_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      subscription: { subscriptionId: (req?.subscriptionId ?? "") },
    });
  }

  /**
   * Returns a subscription.
   */
  async inspectSubscription(req: notificationsSubscriptionAdminServiceApi.InspectSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.InspectSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectSubscription", req);
    this.logger.info("inspect_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionAdminServiceApi.InspectSubscriptionResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Locks a subscription.
   */
  async lockSubscription(req: notificationsSubscriptionAdminServiceApi.LockSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.LockSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "LockSubscription", req);
    this.logger.info("lock_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionAdminServiceApi.LockSubscriptionResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      subscription: { subscriptionId: (req?.subscriptionId ?? "") },
    });
  }

  /**
   * Deletes a subscription.
   */
  async purgeSubscription(req: notificationsSubscriptionAdminServiceApi.PurgeSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.PurgeSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "PurgeSubscription", req);
    this.logger.info("purge_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsSubscriptionAdminServiceApi.PurgeSubscriptionResponse.fromPartial({});
  }

  /**
   * Reassigns a subscription.
   */
  async reassignSubscription(req: notificationsSubscriptionAdminServiceApi.ReassignSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.ReassignSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReassignSubscription", req);
    this.logger.info("reassign_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionAdminServiceApi.ReassignSubscriptionResponse.fromPartial({
      subscription: {
        owner: { userId: (req?.details?.assignee?.userId ?? "") },
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Restores a subscription.
   */
  async restoreSubscription(req: notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.RestoreSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "RestoreSubscription", req);
    this.logger.info("restore_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionAdminServiceApi.RestoreSubscriptionResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      subscription: { subscriptionId: (req?.subscriptionId ?? "") },
    });
  }

  /**
   * Transfers a subscription.
   */
  async transferSubscription(req: notificationsSubscriptionAdminServiceApi.TransferSubscriptionRequest): Promise<notificationsSubscriptionAdminServiceApi.TransferSubscriptionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "TransferSubscription", req);
    this.logger.info("transfer_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionAdminServiceApi.TransferSubscriptionResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      subscription: { subscriptionId: (req?.subscriptionId ?? "") },
    });
  }
}
