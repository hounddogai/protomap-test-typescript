/**
 * Runs the long-lived workflow that takes a delivery attempt from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptWorkflowWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a delivery attempt.
   */
  async advanceDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "AdvanceDeliveryAttemptWorkflow", req);
    this.logger.info("advance_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.deliveryAttempt?.subject?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
    });
    const method1 = "submitSubscription" as const;
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse.fromPartial({
        deliveryAttempt: {
          deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
          sequence: (req?.deliveryAttempt?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Cancels a delivery attempt.
   */
  async cancelDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "CancelDeliveryAttemptWorkflow", req);
    this.logger.info("cancel_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.deliveryAttempt?.occurredAt },
    });
    const proxy1 = forwarding(this.notificationsSubscriptionApprovalClient);
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse> =
      (input, done) => proxy1.listPendingSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse.fromPartial({
        deliveryAttempt: {
          deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
          occurredAt: req?.deliveryAttempt?.occurredAt,
        },
      }),
    );
  }

  /**
   * Returns a delivery attempt.
   */
  async inspectDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectDeliveryAttemptWorkflow", req);
    this.logger.info("inspect_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Lists delivery attempts a page at a time.
   */
  async listDeliveryAttemptWorkflows(req: notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListDeliveryAttemptWorkflows", req);
    this.logger.info("list_delivery_attempt_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a delivery attempt.
   */
  async pauseDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "PauseDeliveryAttemptWorkflow", req);
    this.logger.info("pause_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Resumes a delivery attempt.
   */
  async resumeDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ResumeDeliveryAttemptWorkflow", req);
    this.logger.info("resume_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Retrys a delivery attempt.
   */
  async retryDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RetryDeliveryAttemptWorkflow", req);
    this.logger.info("retry_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        occurredAt: req?.deliveryAttempt?.occurredAt,
      },
    });
  }

  /**
   * Signals a delivery attempt.
   */
  async signalDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "SignalDeliveryAttemptWorkflow", req);
    this.logger.info("signal_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      result: { correlationId: (req?.deliveryAttempt?.correlationId ?? "") },
    });
  }

  /**
   * Starts a delivery attempt.
   */
  async startDeliveryAttemptWorkflow(req: notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest): Promise<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "StartDeliveryAttemptWorkflow", req);
    this.logger.info("start_delivery_attempt_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse.fromPartial({
      deliveryAttempt: {
        correlationId: (req?.deliveryAttempt?.correlationId ?? ""),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }
}
