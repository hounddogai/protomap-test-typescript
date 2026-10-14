/**
 * Keeps every version of a subscription and restores earlier ones. Remote work stays behind typed client ports.
 */

import * as notificationsSubscriptionHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSubscriptionRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionHistoryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Annotates a subscription.
   */
  async annotateSubscriptionVersion(req: notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest): Promise<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "AnnotateSubscriptionVersion", req);
    this.logger.info("annotate_subscription_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse.fromPartial({
      subscription: {
        subscriptionId: (req?.subscriptionId ?? ""),
        version: (req?.subscription?.version ?? 0),
      },
    });
  }

  /**
   * Compares a subscription.
   */
  async compareSubscriptionVersions(req: notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest): Promise<notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "CompareSubscriptionVersions", req);
    this.logger.info("compare_subscription_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse.fromPartial({
      subscription: {
        owner: req?.subscription?.owner,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Returns a subscription.
   */
  async getSubscriptionVersion(req: notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionRequest): Promise<notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionVersion", req);
    this.logger.info("get_subscription_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listSubscriptionVersions(req: notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest): Promise<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSubscriptionVersions", req);
    this.logger.info("list_subscription_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse.fromPartial({});
  }

  /**
   * Deletes a subscription.
   */
  async pruneSubscriptionVersions(req: notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsRequest): Promise<notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "PruneSubscriptionVersions", req);
    this.logger.info("prune_subscription_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsResponse.fromPartial({});
  }

  /**
   * Records a subscription.
   */
  async recordSubscriptionVersion(req: notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest): Promise<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "RecordSubscriptionVersion", req);
    this.logger.info("record_subscription_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse.fromPartial({
      subscription: {
        owner: req?.subscription?.owner,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Reverts a subscription.
   */
  async revertSubscription(req: notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest): Promise<notificationsSubscriptionHistoryServiceApi.RevertSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "RevertSubscription", req);
    this.logger.info("revert_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionHistoryServiceApi.RevertSubscriptionResponse.fromPartial({
      subscription: {
        owner: req?.subscription?.owner,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }
}

/**
 * The gRPC boundary for SubscriptionHistoryService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionHistoryHandler {
  constructor(@inject(SubscriptionHistoryWorkflow) private readonly workflow: SubscriptionHistoryWorkflow) {}

  /**
   * Annotates a subscription.
   */
  annotateSubscriptionVersion = unary<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse>(
    (request) => this.workflow.annotateSubscriptionVersion(request),
  );

  /**
   * Compares a subscription.
   */
  compareSubscriptionVersions = unary<notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse>(
    (request) => this.workflow.compareSubscriptionVersions(request),
  );

  /**
   * Returns a subscription.
   */
  getSubscriptionVersion = (call: ServerUnaryCall<notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionResponse>, done: sendUnaryData<notificationsSubscriptionHistoryServiceApi.GetSubscriptionVersionResponse>): void => {
    void this.workflow.getSubscriptionVersion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists subscriptions a page at a time.
   */
  listSubscriptionVersions = unary<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse>(
    (request) => this.workflow.listSubscriptionVersions(request),
  );

  /**
   * Deletes a subscription.
   */
  pruneSubscriptionVersions = unary<notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsResponse>(
    (request) => this.workflow.pruneSubscriptionVersions(request),
  );

  /**
   * Records a subscription.
   */
  recordSubscriptionVersion = (call: ServerUnaryCall<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse>, done: sendUnaryData<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse>): void => {
    void this.workflow.recordSubscriptionVersion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reverts a subscription.
   */
  revertSubscription = unary<notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest, notificationsSubscriptionHistoryServiceApi.RevertSubscriptionResponse>(
    (request) => this.workflow.revertSubscription(request),
  );
}

export function implementation(handler: SubscriptionHistoryHandler): notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceServer {
  return {
    annotateSubscriptionVersion: handler.annotateSubscriptionVersion,
    compareSubscriptionVersions: handler.compareSubscriptionVersions,
    getSubscriptionVersion: handler.getSubscriptionVersion,
    listSubscriptionVersions: handler.listSubscriptionVersions,
    pruneSubscriptionVersions: handler.pruneSubscriptionVersions,
    recordSubscriptionVersion: handler.recordSubscriptionVersion,
    revertSubscription: handler.revertSubscription,
  };
}
