/**
 * Routes subscriptions through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, metadataFor, retry, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSubscriptionRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionApprovalWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a subscription.
   */
  async approveSubscription(req: notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionRequest): Promise<notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "ApproveSubscription", req);
    this.logger.info("approve_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionResponse.fromPartial({
      subscription: {
        status: req?.subscription?.status,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Comments a subscription.
   */
  async commentSubscriptionApproval(req: notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest): Promise<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "CommentSubscriptionApproval", req);
    this.logger.info("comment_subscription_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse.fromPartial({
      subscription: {
        effective: req?.subscription?.effective,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Delegates a subscription.
   */
  async delegateSubscriptionApproval(req: notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest): Promise<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "DelegateSubscriptionApproval", req);
    this.logger.info("delegate_subscription_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.details?.approver?.userId ?? "") },
        audit: { createdBy: (req?.subscription?.audit?.createdBy ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.recalculateNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse.fromPartial({
        subscription: { owner: { email: (reply1?.notification?.requester?.email ?? "") } },
      }),
      notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse.fromPartial({
        subscription: {
          priority: (req?.subscription?.priority ?? 0),
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a subscription.
   */
  async escalateSubscription(req: notificationsSubscriptionApprovalServiceApi.EscalateSubscriptionRequest): Promise<notificationsSubscriptionApprovalServiceApi.EscalateSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "EscalateSubscription", req);
    this.logger.info("escalate_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionApprovalServiceApi.EscalateSubscriptionResponse.fromPartial({
      subscription: {
        subscriptionId: (req?.subscriptionId ?? ""),
        version: (req?.subscription?.version ?? 0),
      },
    });
  }

  /**
   * Returns a subscription.
   */
  async getSubscriptionApprovalStatus(req: notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest): Promise<notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionApprovalStatus", req);
    this.logger.info("get_subscription_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listPendingSubscriptions(req: notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest): Promise<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingSubscriptions", req);
    this.logger.info("list_pending_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse.fromPartial({});
  }

  /**
   * Recalls a subscription.
   */
  async recallSubscription(req: notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest): Promise<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "RecallSubscription", req);
    this.logger.info("recall_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse.fromPartial({
      subscription: {
        description: (req?.subscription?.description ?? ""),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Rejects a subscription.
   */
  async rejectSubscription(req: notificationsSubscriptionApprovalServiceApi.RejectSubscriptionRequest): Promise<notificationsSubscriptionApprovalServiceApi.RejectSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "RejectSubscription", req);
    this.logger.info("reject_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionApprovalServiceApi.RejectSubscriptionResponse.fromPartial({
      subscription: {
        subscriptionId: (req?.subscriptionId ?? ""),
        version: (req?.subscription?.version ?? 0),
      },
    });
  }

  /**
   * Submits a subscription.
   */
  async submitSubscription(req: notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest): Promise<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "SubmitSubscription", req);
    this.logger.info("submit_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.QuoteNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.subscription?.owner?.userId ?? "") },
        requester: { email: (req?.subscription?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.quoteNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse.fromPartial({
        subscription: { owner: { userId: (reply1?.notification?.assignee?.userId ?? "") } },
      }),
      notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse.fromPartial({
        subscription: {
          parameters: (req?.subscription?.parameters ?? {}),
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for SubscriptionApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionApprovalHandler {
  constructor(@inject(SubscriptionApprovalWorkflow) private readonly workflow: SubscriptionApprovalWorkflow) {}

  /**
   * Approves a subscription.
   */
  approveSubscription = unary<notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionResponse>(
    (request) => this.workflow.approveSubscription(request),
  );

  /**
   * Comments a subscription.
   */
  commentSubscriptionApproval = unary<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>(
    (request) => this.workflow.commentSubscriptionApproval(request),
  );

  /**
   * Delegates a subscription.
   */
  delegateSubscriptionApproval = (call: ServerUnaryCall<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>, done: sendUnaryData<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>): void => {
    void this.workflow.delegateSubscriptionApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a subscription.
   */
  escalateSubscription = unary<notificationsSubscriptionApprovalServiceApi.EscalateSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.EscalateSubscriptionResponse>(
    (request) => this.workflow.escalateSubscription(request),
  );

  /**
   * Returns a subscription.
   */
  getSubscriptionApprovalStatus = unary<notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest, notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusResponse>(
    (request) => this.workflow.getSubscriptionApprovalStatus(request),
  );

  /**
   * Lists subscriptions a page at a time.
   */
  listPendingSubscriptions = (call: ServerUnaryCall<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>, done: sendUnaryData<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>): void => {
    void this.workflow.listPendingSubscriptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a subscription.
   */
  recallSubscription = unary<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse>(
    (request) => this.workflow.recallSubscription(request),
  );

  /**
   * Rejects a subscription.
   */
  rejectSubscription = unary<notificationsSubscriptionApprovalServiceApi.RejectSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RejectSubscriptionResponse>(
    (request) => this.workflow.rejectSubscription(request),
  );

  /**
   * Submits a subscription.
   */
  submitSubscription = (call: ServerUnaryCall<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse>, done: sendUnaryData<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse>): void => {
    void this.workflow.submitSubscription(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: SubscriptionApprovalHandler): notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceServer {
  return {
    approveSubscription: handler.approveSubscription,
    commentSubscriptionApproval: handler.commentSubscriptionApproval,
    delegateSubscriptionApproval: handler.delegateSubscriptionApproval,
    escalateSubscription: handler.escalateSubscription,
    getSubscriptionApprovalStatus: handler.getSubscriptionApprovalStatus,
    listPendingSubscriptions: handler.listPendingSubscriptions,
    recallSubscription: handler.recallSubscription,
    rejectSubscription: handler.rejectSubscription,
    submitSubscription: handler.submitSubscription,
  };
}
