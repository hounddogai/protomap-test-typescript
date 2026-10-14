/**
 * Keeps subscriptions in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSubscriptionRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionSyncWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a subscription.
   */
  async getSubscriptionSyncState(req: notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateRequest): Promise<notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionSyncState", req);
    this.logger.info("get_subscription_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listSubscriptionConflicts(req: notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest): Promise<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSubscriptionConflicts", req);
    this.logger.info("list_subscription_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.listDeliveryAttemptWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse.fromPartial({
      pageInfo: { nextPageToken: (reply1?.pageInfo?.nextPageToken ?? "") },
      result: { details: (reply1?.result?.details ?? {}) },
    });
  }

  /**
   * Pulls a subscription.
   */
  async pullSubscriptions(req: notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest): Promise<notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "PullSubscriptions", req);
    this.logger.info("pull_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse.fromPartial({
      subscription: {
        parameters: (req?.subscription?.parameters ?? {}),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Pushs a subscription.
   */
  async pushSubscription(req: notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest): Promise<notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "PushSubscription", req);
    this.logger.info("push_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse.fromPartial({
      subscription: {
        parameters: (req?.subscription?.parameters ?? {}),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Reconciles a subscription.
   */
  async reconcileSubscriptions(req: notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsRequest): Promise<notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "ReconcileSubscriptions", req);
    this.logger.info("reconcile_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse.fromPartial({
      subscription: {
        effective: req?.subscription?.effective,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Resolves a subscription.
   */
  async resolveSubscriptionConflict(req: notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest): Promise<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "ResolveSubscriptionConflict", req);
    this.logger.info("resolve_subscription_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (req?.subscription?.owner?.displayName ?? "") },
      },
      details: { notify: { email: (req?.subscription?.owner?.email ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.resumeDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse.fromPartial({
        subscription: {
          status: req?.subscription?.status,
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of subscriptions with a peer.
   */
  async streamSubscriptionChanges(req: notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest): Promise<notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamSubscriptionChanges", req);
    this.logger.info("stream_subscription_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({
      subscription: {
        status: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.status,
        subscriptionId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Syncs a subscription.
   */
  async syncSubscriptions(req: notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest): Promise<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "SyncSubscriptions", req);
    this.logger.info("sync_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse.fromPartial({
      subscription: {
        priority: (req?.subscription?.priority ?? 0),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }
}
