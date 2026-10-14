/**
 * Runs the long-lived workflow that takes a subscription from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSubscriptionRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionWorkflowWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a subscription.
   */
  async advanceSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "AdvanceSubscriptionWorkflow", req);
    this.logger.info("advance_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.subscription?.owner?.userId ?? "") },
        audit: { etag: (req?.subscription?.audit?.etag ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.subscription?.owner?.displayName ?? "") } },
        requester: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.explainNotificationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowResponse.fromPartial({
        subscription: { audit: { etag: (reply1?.notification?.audit?.etag ?? "") } },
      }),
      notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowResponse.fromPartial({
        subscription: {
          priority: (req?.subscription?.priority ?? 0),
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a subscription.
   */
  async cancelSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "CancelSubscriptionWorkflow", req);
    this.logger.info("cancel_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.notify?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const method1 = "retryDeliveryAttemptWorkflow" as const;
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse.fromPartial({
        subscription: {
          effective: req?.subscription?.effective,
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a subscription.
   */
  async inspectSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectSubscriptionWorkflow", req);
    this.logger.info("inspect_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { updatedAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.authorizationAccessPolicyClient);
    const invoke1: Unary<authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest, authorizationAccessPolicyServiceApi.CloneAccessPolicyResponse> =
      (input, done) => proxy1.cloneAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest, authorizationAccessPolicyServiceApi.CloneAccessPolicyResponse>(invoke1, request1);
    return mergeResponses(
      notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        subscription: {
          owner: { displayName: (reply1?.accessPolicy?.owner?.displayName ?? "") },
        },
      }),
      notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } }),
    );
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listSubscriptionWorkflows(req: notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest): Promise<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSubscriptionWorkflows", req);
    this.logger.info("list_subscription_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a subscription.
   */
  async pauseSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "PauseSubscriptionWorkflow", req);
    this.logger.info("pause_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (req?.subscription?.owner?.displayName ?? "") },
      },
      details: {
        notify: {
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.retryDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse.fromPartial({
        subscription: {
          subscriptionId: (req?.subscriptionId ?? ""),
          version: (req?.subscription?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Resumes a subscription.
   */
  async resumeSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "ResumeSubscriptionWorkflow", req);
    this.logger.info("resume_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse.fromPartial({
      subscription: {
        status: req?.subscription?.status,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Retrys a subscription.
   */
  async retrySubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "RetrySubscriptionWorkflow", req);
    this.logger.info("retry_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse.fromPartial({
      subscription: {
        owner: req?.subscription?.owner,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Signals a subscription.
   */
  async signalSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "SignalSubscriptionWorkflow", req);
    this.logger.info("signal_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse.fromPartial({
      subscription: {
        priority: (req?.subscription?.priority ?? 0),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Starts a subscription.
   */
  async startSubscriptionWorkflow(req: notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowRequest): Promise<notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "StartSubscriptionWorkflow", req);
    this.logger.info("start_subscription_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: req?.subscription?.effective },
      reason: ((req?.subscription?.action?.$case === "block" ? req?.subscription?.action.block : undefined)?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse.fromPartial({
        subscription: {
          parameters: (req?.details?.parameters ?? {}),
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for SubscriptionWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionWorkflowHandler {
  constructor(@inject(SubscriptionWorkflowWorkflow) private readonly workflow: SubscriptionWorkflowWorkflow) {}

  /**
   * Advances a subscription.
   */
  advanceSubscriptionWorkflow = unary<notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.AdvanceSubscriptionWorkflowResponse>(
    (request) => this.workflow.advanceSubscriptionWorkflow(request),
  );

  /**
   * Cancels a subscription.
   */
  cancelSubscriptionWorkflow = unary<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse>(
    (request) => this.workflow.cancelSubscriptionWorkflow(request),
  );

  /**
   * Returns a subscription.
   */
  inspectSubscriptionWorkflow = (call: ServerUnaryCall<notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowResponse>, done: sendUnaryData<notificationsSubscriptionWorkflowServiceApi.InspectSubscriptionWorkflowResponse>): void => {
    void this.workflow.inspectSubscriptionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists subscriptions a page at a time.
   */
  listSubscriptionWorkflows = unary<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse>(
    (request) => this.workflow.listSubscriptionWorkflows(request),
  );

  /**
   * Pauses a subscription.
   */
  pauseSubscriptionWorkflow = unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>(
    (request) => this.workflow.pauseSubscriptionWorkflow(request),
  );

  /**
   * Resumes a subscription.
   */
  resumeSubscriptionWorkflow = (call: ServerUnaryCall<notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse>, done: sendUnaryData<notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse>): void => {
    void this.workflow.resumeSubscriptionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a subscription.
   */
  retrySubscriptionWorkflow = unary<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>(
    (request) => this.workflow.retrySubscriptionWorkflow(request),
  );

  /**
   * Signals a subscription.
   */
  signalSubscriptionWorkflow = unary<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse>(
    (request) => this.workflow.signalSubscriptionWorkflow(request),
  );

  /**
   * Starts a subscription.
   */
  startSubscriptionWorkflow = (call: ServerUnaryCall<notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse>, done: sendUnaryData<notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse>): void => {
    void this.workflow.startSubscriptionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: SubscriptionWorkflowHandler): notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceServer {
  return {
    advanceSubscriptionWorkflow: handler.advanceSubscriptionWorkflow,
    cancelSubscriptionWorkflow: handler.cancelSubscriptionWorkflow,
    inspectSubscriptionWorkflow: handler.inspectSubscriptionWorkflow,
    listSubscriptionWorkflows: handler.listSubscriptionWorkflows,
    pauseSubscriptionWorkflow: handler.pauseSubscriptionWorkflow,
    resumeSubscriptionWorkflow: handler.resumeSubscriptionWorkflow,
    retrySubscriptionWorkflow: handler.retrySubscriptionWorkflow,
    signalSubscriptionWorkflow: handler.signalSubscriptionWorkflow,
    startSubscriptionWorkflow: handler.startSubscriptionWorkflow,
  };
}
