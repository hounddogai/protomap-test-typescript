/**
 * Runs the long-lived workflow that takes an exposure from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as experimentsExposureImportServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as procurementPurchaseRequisitionServiceApi from "../../../../../.cache/proto/acme/procurement/v1/purchase_requisition_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toExposureRecord } from "../../data/records.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureWorkflowWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureApprovalService") private readonly experimentsExposureApprovalClient: experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.procurement.v1.PurchaseRequisitionService") private readonly procurementPurchaseRequisitionClient: procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an exposure.
   */
  async advanceExposureWorkflow(req: experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "AdvanceExposureWorkflow", req);
    this.logger.info("advance_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.EscalateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { email: (req?.details?.notify?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.EscalateExperimentRequest, experimentsExperimentApprovalServiceApi.EscalateExperimentResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.escalateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceExposureWorkflow.EscalateExperiment", () => call<experimentsExperimentApprovalServiceApi.EscalateExperimentRequest, experimentsExperimentApprovalServiceApi.EscalateExperimentResponse>(invoke1, request1));
    const request2 = experimentsExposureImportServiceApi.GetExposureImportStatusRequest.fromPartial({
      context: req?.context,
      exposureId: (req?.exposure?.exposureId ?? ""),
    });
    const invoke2: Unary<experimentsExposureImportServiceApi.GetExposureImportStatusRequest, experimentsExposureImportServiceApi.GetExposureImportStatusResponse> =
      (input, done) => this.experimentsExposureImportClient.getExposureImportStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = auditAuditEventValidationServiceApi.ScoreAuditEventRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
          recipient: (reply1?.experiment?.location?.recipient ?? ""),
        },
      },
    });
    const reply3 = await this.workQueue.enqueue<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>(
      "acme.experiments.v1.ExposureWorkflowService/AdvanceExposureWorkflow:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse.fromPartial({
        exposure: { correlationId: (reply2?.exposure?.correlationId ?? "") },
        outcome: { status: (reply2?.result?.status ?? "") },
      }),
      experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse.fromPartial({
        exposure: { sequence: (reply3?.auditEvent?.sequence ?? 0) },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Cancels an exposure.
   */
  async cancelExposureWorkflow(req: experimentsExposureWorkflowServiceApi.CancelExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.CancelExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "CancelExposureWorkflow", req);
    this.logger.info("cancel_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notify?.email ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
      },
    });
    const stream1 = this.notificationsSubscriptionNotificationClient.streamSubscriptionNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExposureWorkflowServiceApi.CancelExposureWorkflowResponse.fromPartial({
      exposure: {
        exposureId: (req?.exposureId ?? ""),
        sequence: (req?.exposure?.sequence ?? 0),
      },
    });
  }

  /**
   * Returns an exposure.
   */
  async inspectExposureWorkflow(req: experimentsExposureWorkflowServiceApi.InspectExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.InspectExposureWorkflowResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectExposureWorkflow", req);
    this.logger.info("inspect_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureApprovalServiceApi.ApproveExposureRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        effectiveAt: req?.context?.deadline,
      },
      exposure: { exposureId: (req?.exposureId ?? "") },
    });
    const invoke1: Unary<experimentsExposureApprovalServiceApi.ApproveExposureRequest, experimentsExposureApprovalServiceApi.ApproveExposureResponse> =
      (input, done) => this.experimentsExposureApprovalClient.approveExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureApprovalServiceApi.ApproveExposureRequest, experimentsExposureApprovalServiceApi.ApproveExposureResponse>(invoke1, request1));
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.InspectExposureWorkflowResponse.fromPartial({
        exposure: {
          occurredAt: reply1?.exposure?.occurredAt,
          source: (reply1?.exposure?.source ?? ""),
        },
      }),
      experimentsExposureWorkflowServiceApi.InspectExposureWorkflowResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Lists exposures a page at a time.
   */
  async listExposureWorkflows(req: experimentsExposureWorkflowServiceApi.ListExposureWorkflowsRequest): Promise<experimentsExposureWorkflowServiceApi.ListExposureWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExposureWorkflows", req);
    this.logger.info("list_exposure_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExposureWorkflowServiceApi.ListExposureWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses an exposure.
   */
  async pauseExposureWorkflow(req: experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "PauseExposureWorkflow", req);
    this.logger.info("pause_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.RejectExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: {
            email: (req?.details?.notify?.email ?? ""),
            preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.RejectExperimentRequest, experimentsExperimentApprovalServiceApi.RejectExperimentResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.rejectExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExperimentApprovalServiceApi.RejectExperimentResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = experimentsExposureSyncServiceApi.SyncExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        sequence: (req?.exposure?.sequence ?? 0),
        subject: {
          experimentId: (req?.exposure?.subject?.experimentId ?? ""),
          startsAt: req?.exposure?.subject?.startsAt,
        },
      },
    });
    const invoke2: Unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient.syncExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse.fromPartial({ exposure: { subject: reply2?.exposure?.subject } }),
      experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        result: { correlationId: (req?.exposure?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Resumes an exposure.
   */
  async resumeExposureWorkflow(req: experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ResumeExposureWorkflow", req);
    this.logger.info("resume_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<communityForumApprovalServiceApi.SubmitForumResponse>> = [];
    for (const item of (req?.exposure?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({
          context: req?.context,
          forum: {
            children: [{
              children: [{
                audit: { createdAt: item?.observedAt },
                children: [{
                  attributes: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
                }],
                manager: { email: (req?.details?.notify?.email ?? "") },
              }],
            }],
            manager: { displayName: (req?.exposure?.subject?.displayName ?? "") },
          },
        });
        const invoke1: Unary<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse> =
          (input, done) => this.communityForumApprovalClient.submitForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? communityForumApprovalServiceApi.SubmitForumResponse.fromPartial({});
    const request2 = procurementPurchaseRequisitionServiceApi.ClonePurchaseRequisitionRequest.fromPartial({
      context: req?.context,
      purchaseRequisition: {
        audit: {
          createdAt: reply1?.forum?.audit?.createdAt,
          createdBy: (reply1?.forum?.audit?.createdBy ?? ""),
          etag: (reply1?.forum?.audit?.etag ?? ""),
        },
        billingAddress: { recipient: (reply1?.forum?.location?.recipient ?? "") },
      },
    });
    const invoke2: Unary<procurementPurchaseRequisitionServiceApi.ClonePurchaseRequisitionRequest, procurementPurchaseRequisitionServiceApi.ClonePurchaseRequisitionResponse> =
      (input, done) => this.procurementPurchaseRequisitionClient.clonePurchaseRequisition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          source: (req?.exposure?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys an exposure.
   */
  async retryExposureWorkflow(req: experimentsExposureWorkflowServiceApi.RetryExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "RetryExposureWorkflow", req);
    this.logger.info("retry_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureApprovalServiceApi.ListPendingExposuresRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.exposure?.subject?.startsAt,
        labels: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
        ownerId: (req?.exposure?.subject?.experimentId ?? ""),
      },
    });
    const method1 = "listPendingExposures" as const;
    const invoke1: Unary<experimentsExposureApprovalServiceApi.ListPendingExposuresRequest, experimentsExposureApprovalServiceApi.ListPendingExposuresResponse> =
      (input, done) => this.experimentsExposureApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureApprovalServiceApi.ListPendingExposuresRequest, experimentsExposureApprovalServiceApi.ListPendingExposuresResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = auditAuditEventServiceApi.CloneAuditEventRequest.fromPartial({
        auditEvent: {
          measurements: [{
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
        context: req?.context,
      });
      const invoke2: Unary<auditAuditEventServiceApi.CloneAuditEventRequest, auditAuditEventServiceApi.CloneAuditEventResponse> =
        (input, done) => this.auditAuditEventClient.cloneAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<auditAuditEventServiceApi.CloneAuditEventRequest, auditAuditEventServiceApi.CloneAuditEventResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? auditAuditEventServiceApi.CloneAuditEventResponse.fromPartial({});
    const request3 = experimentsExposureImportServiceApi.ListExposureImportsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.exposure?.occurredAt },
    });
    const proxy3 = forwarding(this.experimentsExposureImportClient);
    const invoke3: Unary<experimentsExposureImportServiceApi.ListExposureImportsRequest, experimentsExposureImportServiceApi.ListExposureImportsResponse> =
      (input, done) => proxy3.listExposureImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureImportServiceApi.ListExposureImportsRequest, experimentsExposureImportServiceApi.ListExposureImportsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse.fromPartial({ exposure: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Signals an exposure.
   */
  async signalExposureWorkflow(req: experimentsExposureWorkflowServiceApi.SignalExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "SignalExposureWorkflow", req);
    this.logger.info("signal_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantReportingServiceApi.ScheduleVariantReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsVariantReportingServiceApi.ScheduleVariantReportRequest, experimentsVariantReportingServiceApi.ScheduleVariantReportResponse> =
      (input, done) => this.experimentsVariantReportingClient.scheduleVariantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantReportingServiceApi.ScheduleVariantReportRequest, experimentsVariantReportingServiceApi.ScheduleVariantReportResponse>(invoke1, request1);
    const request2 = experimentsExperimentServiceApi.GetExperimentRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.exposure?.subject?.experimentId ?? ""),
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse> =
      (input, done) => this.experimentsExperimentClient.getExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse.fromPartial({
        exposure: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Starts an exposure.
   */
  async startExposureWorkflow(req: experimentsExposureWorkflowServiceApi.StartExposureWorkflowRequest): Promise<experimentsExposureWorkflowServiceApi.StartExposureWorkflowResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "StartExposureWorkflow", req);
    this.logger.info("start_exposure_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request1 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
        context: req?.context,
        details: { contact: { name: req?.details?.notify?.name } },
        variant: {
          audit: { createdAt: item?.observedAt },
          owner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
        (input, done) => this.experimentsVariantValidationClient.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest.fromPartial({
      context: input2?.context,
      details: { notify: { email: (input2?.details?.notify?.email ?? "") } },
      experiment: {
        audit: { createdAt: reply1?.variant?.audit?.createdAt },
        organizer: { email: (reply1?.variant?.owner?.email ?? "") },
        participants: [{
          contact: { preferredChannel: (input2?.details?.notify?.preferredChannel ?? "") },
        }],
      },
    });
    const invoke2: Unary<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse> =
      (input, done) => this.experimentsExperimentWorkflowClient.resumeExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureWorkflowServiceApi.StartExposureWorkflowResponse.fromPartial({
        exposure: { subject: { experimentId: (reply2?.experiment?.experimentId ?? "") } },
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
      }),
      experimentsExposureWorkflowServiceApi.StartExposureWorkflowResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }
}
