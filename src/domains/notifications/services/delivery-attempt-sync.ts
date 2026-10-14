/**
 * Keeps delivery attempts in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptSyncWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptSyncState(req: notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptSyncState", req);
    this.logger.info("get_delivery_attempt_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Lists delivery attempts a page at a time.
   */
  async listDeliveryAttemptConflicts(req: notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListDeliveryAttemptConflicts", req);
    this.logger.info("list_delivery_attempt_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse.fromPartial({});
  }

  /**
   * Pulls a delivery attempt.
   */
  async pullDeliveryAttempts(req: notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "PullDeliveryAttempts", req);
    this.logger.info("pull_delivery_attempts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse.fromPartial({
        deliveryAttempt: {
          attributes: (req?.deliveryAttempt?.attributes ?? {}),
          deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a delivery attempt.
   */
  async pushDeliveryAttempt(req: notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "PushDeliveryAttempt", req);
    this.logger.info("push_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        sequence: (req?.deliveryAttempt?.sequence ?? 0),
      },
    });
  }

  /**
   * Reconciles a delivery attempt.
   */
  async reconcileDeliveryAttempts(req: notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ReconcileDeliveryAttempts", req);
    this.logger.info("reconcile_delivery_attempts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse.fromPartial({
      deliveryAttempt: {
        attributes: (req?.deliveryAttempt?.attributes ?? {}),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Resolves a delivery attempt.
   */
  async resolveDeliveryAttemptConflict(req: notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ResolveDeliveryAttemptConflict", req);
    this.logger.info("resolve_delivery_attempt_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Exchanges changes of delivery attempts with a peer.
   */
  async streamDeliveryAttemptChanges(req: notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamDeliveryAttemptChanges", req);
    this.logger.info("stream_delivery_attempt_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({
      result: {
        correlationId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.correlationId ?? ""),
      },
      sequence: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.sequence ?? 0),
    });
  }

  /**
   * Syncs a delivery attempt.
   */
  async syncDeliveryAttempts(req: notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest): Promise<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "SyncDeliveryAttempts", req);
    this.logger.info("sync_delivery_attempts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }
}

/**
 * The gRPC boundary for DeliveryAttemptSyncService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptSyncHandler {
  constructor(@inject(DeliveryAttemptSyncWorkflow) private readonly workflow: DeliveryAttemptSyncWorkflow) {}

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptSyncState = unary<notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateRequest, notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateResponse>(
    (request) => this.workflow.getDeliveryAttemptSyncState(request),
  );

  /**
   * Lists delivery attempts a page at a time.
   */
  listDeliveryAttemptConflicts = unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(
    (request) => this.workflow.listDeliveryAttemptConflicts(request),
  );

  /**
   * Pulls a delivery attempt.
   */
  pullDeliveryAttempts = (call: ServerUnaryCall<notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse>, done: sendUnaryData<notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse>): void => {
    void this.workflow.pullDeliveryAttempts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pushs a delivery attempt.
   */
  pushDeliveryAttempt = unary<notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptRequest, notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptResponse>(
    (request) => this.workflow.pushDeliveryAttempt(request),
  );

  /**
   * Reconciles a delivery attempt.
   */
  reconcileDeliveryAttempts = unary<notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse>(
    (request) => this.workflow.reconcileDeliveryAttempts(request),
  );

  /**
   * Resolves a delivery attempt.
   */
  resolveDeliveryAttemptConflict = (call: ServerUnaryCall<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse>, done: sendUnaryData<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse>): void => {
    void this.workflow.resolveDeliveryAttemptConflict(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Exchanges changes of delivery attempts with a peer.
   */
  streamDeliveryAttemptChanges = duplex<notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest, notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse>(
    (request) => this.workflow.streamDeliveryAttemptChanges(request),
  );

  /**
   * Syncs a delivery attempt.
   */
  syncDeliveryAttempts = unary<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse>(
    (request) => this.workflow.syncDeliveryAttempts(request),
  );
}

export function implementation(handler: DeliveryAttemptSyncHandler): notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceServer {
  return {
    getDeliveryAttemptSyncState: handler.getDeliveryAttemptSyncState,
    listDeliveryAttemptConflicts: handler.listDeliveryAttemptConflicts,
    pullDeliveryAttempts: handler.pullDeliveryAttempts,
    pushDeliveryAttempt: handler.pushDeliveryAttempt,
    reconcileDeliveryAttempts: handler.reconcileDeliveryAttempts,
    resolveDeliveryAttemptConflict: handler.resolveDeliveryAttemptConflict,
    streamDeliveryAttemptChanges: handler.streamDeliveryAttemptChanges,
    syncDeliveryAttempts: handler.syncDeliveryAttempts,
  };
}
