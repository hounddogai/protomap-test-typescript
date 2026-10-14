/**
 * Moves an exposure between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as experimentsExposureLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureLifecycleWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates an exposure.
   */
  async activateExposure(req: experimentsExposureLifecycleServiceApi.ActivateExposureRequest): Promise<experimentsExposureLifecycleServiceApi.ActivateExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateExposure", req);
    this.logger.info("activate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.batchGetNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(invoke1, request1));
    const request2 = notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest, notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateHistoryClient.revertNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ActivateExposure.RevertNotificationTemplate", () => call<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest, notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.ActivateExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsExposureLifecycleServiceApi.ActivateExposureResponse.fromPartial({
        exposure: {
          subject: {
            displayName: (reply2?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      experimentsExposureLifecycleServiceApi.ActivateExposureResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires an exposure.
   */
  async expireExposure(req: experimentsExposureLifecycleServiceApi.ExpireExposureRequest): Promise<experimentsExposureLifecycleServiceApi.ExpireExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireExposure", req);
    this.logger.info("expire_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventQueryServiceApi.ResolveAuditEventsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<auditAuditEventQueryServiceApi.ResolveAuditEventsRequest, auditAuditEventQueryServiceApi.ResolveAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.resolveAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.details?.newOwner?.userId ?? "") } },
      profile: {
        relationshipManager: { email: (req?.details?.notifyContact?.email ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest, personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse>(
      "acme.experiments.v1.ExposureLifecycleService/ExpireExposure:1", request2,
    );
    const request3 = notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { updatedAt: reply2?.profile?.audit?.updatedAt },
        billingAddress: { postalCode: (reply2?.profile?.primaryAddress?.postalCode ?? "") },
      },
    });
    const invoke3: Unary<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest, notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.pushNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest, notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse>(invoke3, request3));
    const request4 = personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: reply2?.profile?.preferences?.quietHours },
      reason: (req?.reason ?? ""),
    });
    const invoke4: Unary<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.scheduleRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.ExpireExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      experimentsExposureLifecycleServiceApi.ExpireExposureResponse.fromPartial({
        exposure: {
          subject: {
            displayName: (reply2?.profile?.relationshipManager?.displayName ?? ""),
          },
        },
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
      }),
      experimentsExposureLifecycleServiceApi.ExpireExposureResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      experimentsExposureLifecycleServiceApi.ExpireExposureResponse.fromPartial({
        exposure: { correlationId: (reply4?.result?.correlationId ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      experimentsExposureLifecycleServiceApi.ExpireExposureResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Returns an exposure.
   */
  async getExposureLifecycle(req: experimentsExposureLifecycleServiceApi.GetExposureLifecycleRequest): Promise<experimentsExposureLifecycleServiceApi.GetExposureLifecycleResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExposureLifecycle", req);
    this.logger.info("get_exposure_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.exposureId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.personalizationRecommendationReportingClient.streamRecommendationMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({});
    const request2 = communityPostApprovalServiceApi.ApprovePostRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
      post: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke2: Unary<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse> =
      (input, done) => this.communityPostApprovalClient.approvePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.GetExposureLifecycleResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      experimentsExposureLifecycleServiceApi.GetExposureLifecycleResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Reinstates an exposure.
   */
  async reinstateExposure(req: experimentsExposureLifecycleServiceApi.ReinstateExposureRequest): Promise<experimentsExposureLifecycleServiceApi.ReinstateExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateExposure", req);
    this.logger.info("reinstate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantSyncServiceApi.ResolveVariantConflictRequest.fromPartial({
      context: req?.context,
      variant: {
        owner: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<experimentsVariantSyncServiceApi.ResolveVariantConflictRequest, experimentsVariantSyncServiceApi.ResolveVariantConflictResponse> =
      (input, done) => this.experimentsVariantSyncClient.resolveVariantConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = auditAuditEventQueryServiceApi.FindAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.variant?.parameters ?? {}))),
        ownerId: (reply1?.variant?.variantId ?? ""),
      },
    });
    const method2 = "findAuditEvents" as const;
    const invoke2: Unary<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.ReinstateExposureResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      experimentsExposureLifecycleServiceApi.ReinstateExposureResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      experimentsExposureLifecycleServiceApi.ReinstateExposureResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews an exposure.
   */
  async renewExposure(req: experimentsExposureLifecycleServiceApi.RenewExposureRequest): Promise<experimentsExposureLifecycleServiceApi.RenewExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewExposure", req);
    this.logger.info("renew_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.LintExposuresRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.experimentsExposureValidationClient);
    const invoke1: Unary<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse> =
      (input, done) => proxy1.lintExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.RenewExposureResponse.fromPartial({
        result: {
          correlationId: (reply1?.exposure?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      experimentsExposureLifecycleServiceApi.RenewExposureResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Suspends an exposure.
   */
  async suspendExposure(req: experimentsExposureLifecycleServiceApi.SuspendExposureRequest): Promise<experimentsExposureLifecycleServiceApi.SuspendExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendExposure", req);
    this.logger.info("suspend_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostApprovalServiceApi.ApprovePostRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.details?.newOwner?.userId ?? "") } },
    });
    const invoke1: Unary<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse> =
      (input, done) => this.communityPostApprovalClient.approvePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.SuspendExposureResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsExposureLifecycleServiceApi.SuspendExposureResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates an exposure.
   */
  async terminateExposure(req: experimentsExposureLifecycleServiceApi.TerminateExposureRequest): Promise<experimentsExposureLifecycleServiceApi.TerminateExposureResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateExposure", req);
    this.logger.info("terminate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventServiceApi.BatchGetAuditEventsRequest.fromPartial({ context: req?.context });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.batchGetAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureLifecycleServiceApi.TerminateExposureResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      experimentsExposureLifecycleServiceApi.TerminateExposureResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ExposureLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureLifecycleHandler {
  constructor(@inject(ExposureLifecycleWorkflow) private readonly workflow: ExposureLifecycleWorkflow) {}

  /**
   * Activates an exposure.
   */
  activateExposure = unary<experimentsExposureLifecycleServiceApi.ActivateExposureRequest, experimentsExposureLifecycleServiceApi.ActivateExposureResponse>(
    (request) => this.workflow.activateExposure(request),
  );

  /**
   * Expires an exposure.
   */
  expireExposure = unary<experimentsExposureLifecycleServiceApi.ExpireExposureRequest, experimentsExposureLifecycleServiceApi.ExpireExposureResponse>(
    (request) => this.workflow.expireExposure(request),
  );

  /**
   * Returns an exposure.
   */
  getExposureLifecycle = (call: ServerUnaryCall<experimentsExposureLifecycleServiceApi.GetExposureLifecycleRequest, experimentsExposureLifecycleServiceApi.GetExposureLifecycleResponse>, done: sendUnaryData<experimentsExposureLifecycleServiceApi.GetExposureLifecycleResponse>): void => {
    void this.workflow.getExposureLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates an exposure.
   */
  reinstateExposure = unary<experimentsExposureLifecycleServiceApi.ReinstateExposureRequest, experimentsExposureLifecycleServiceApi.ReinstateExposureResponse>(
    (request) => this.workflow.reinstateExposure(request),
  );

  /**
   * Renews an exposure.
   */
  renewExposure = unary<experimentsExposureLifecycleServiceApi.RenewExposureRequest, experimentsExposureLifecycleServiceApi.RenewExposureResponse>(
    (request) => this.workflow.renewExposure(request),
  );

  /**
   * Suspends an exposure.
   */
  suspendExposure = (call: ServerUnaryCall<experimentsExposureLifecycleServiceApi.SuspendExposureRequest, experimentsExposureLifecycleServiceApi.SuspendExposureResponse>, done: sendUnaryData<experimentsExposureLifecycleServiceApi.SuspendExposureResponse>): void => {
    void this.workflow.suspendExposure(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates an exposure.
   */
  terminateExposure = unary<experimentsExposureLifecycleServiceApi.TerminateExposureRequest, experimentsExposureLifecycleServiceApi.TerminateExposureResponse>(
    (request) => this.workflow.terminateExposure(request),
  );
}

export function implementation(handler: ExposureLifecycleHandler): experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceServer {
  return {
    activateExposure: handler.activateExposure,
    expireExposure: handler.expireExposure,
    getExposureLifecycle: handler.getExposureLifecycle,
    reinstateExposure: handler.reinstateExposure,
    renewExposure: handler.renewExposure,
    suspendExposure: handler.suspendExposure,
    terminateExposure: handler.terminateExposure,
  };
}
