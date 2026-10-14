/**
 * Routes experiments through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as communityForumServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureImportServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as identityUserQueryServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as maintenanceWorkOrderQueryServiceApi from "../../../../../.cache/proto/acme/maintenance/v1/work_order_query_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as performersPerformerQueryServiceApi from "../../../../../.cache/proto/acme/performers/v1/performer_query_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toExperimentRecord } from "../../data/records.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentApprovalWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderQueryService") private readonly maintenanceWorkOrderQueryClient: maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.performers.v1.PerformerQueryService") private readonly performersPerformerQueryClient: performersPerformerQueryServiceApi.PerformerQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an experiment.
   */
  async approveExperiment(req: experimentsExperimentApprovalServiceApi.ApproveExperimentRequest): Promise<experimentsExperimentApprovalServiceApi.ApproveExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ApproveExperiment", req);
    this.logger.info("approve_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest.fromPartial({
      context: req?.context,
      etag: (req?.experiment?.audit?.etag ?? ""),
      experimentId: (req?.experiment?.experimentId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest, experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse> =
      (input, done) => this.experimentsExperimentReportingClient.deleteExperimentReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.ApproveExperimentResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsExperimentApprovalServiceApi.ApproveExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Comments an experiment.
   */
  async commentExperimentApproval(req: experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest): Promise<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CommentExperimentApproval", req);
    this.logger.info("comment_experiment_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentQueryServiceApi.BrowseExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.experiment?.audit?.updatedAt,
        region: (req?.experiment?.location?.region ?? ""),
      },
    });
    const invoke1: Unary<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.browseExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = experimentsExposureSyncServiceApi.ReconcileExposuresRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: {
        subject: {
          displayName: (req?.experiment?.organizer?.displayName ?? ""),
          experimentId: (req?.experiment?.experimentId ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient.reconcileExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = experimentsExperimentServiceApi.ListExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.exposure?.occurredAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.experiment?.location?.region ?? ""),
      },
    });
    const method3 = "listExperiments" as const;
    const invoke3: Unary<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse> =
      (input, done) => this.experimentsExperimentClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          organizer: req?.experiment?.organizer,
        },
      }),
    );
  }

  /**
   * Delegates an experiment.
   */
  async delegateExperimentApproval(req: experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalRequest): Promise<experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "DelegateExperimentApproval", req);
    this.logger.info("delegate_experiment_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserQueryServiceApi.ResolveUsersRequest.fromPartial({ context: req?.context });
    const proxy1 = forwarding(this.identityUserQueryClient);
    const invoke1: Unary<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse> =
      (input, done) => proxy1.resolveUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse>(invoke1, request1);
    const request2 = experimentsExperimentQueryServiceApi.BrowseExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.experiment?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.experiment?.metadata ?? {}))),
        region: (req?.experiment?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.browseExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse>(invoke2, request2);
    const request3 = personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { lines: (req?.experiment?.location?.lines ?? []).map((value) => value) },
        counterparty: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse> =
      (input, done) => this.personalizationRecommendationWorkflowClient.pauseRecommendationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse.fromPartial({
        experiment: {
          participants: [{
            contact: { email: (reply3?.recommendation?.counterparty?.email ?? "") },
          }],
        },
      }),
      experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          status: req?.experiment?.status,
        },
      }),
    );
  }

  /**
   * Escalates an experiment.
   */
  async escalateExperiment(req: experimentsExperimentApprovalServiceApi.EscalateExperimentRequest): Promise<experimentsExperimentApprovalServiceApi.EscalateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "EscalateExperiment", req);
    this.logger.info("escalate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsExposureSyncServiceApi.PushExposureRequest.fromPartial({
      context: input1?.context,
      exposure: {
        subject: { displayName: (input1?.details?.approver?.displayName ?? "") },
      },
    });
    const invoke1: Unary<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse> =
      (input, done) => this.experimentsExposureSyncClient.pushExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.EscalateExperimentResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      experimentsExperimentApprovalServiceApi.EscalateExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async getExperimentApprovalStatus(req: experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusRequest): Promise<experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExperimentApprovalStatus", req);
    this.logger.info("get_experiment_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.experimentId ?? "") },
    });
    const stream1 = this.notificationsNotificationTemplateQueryClient.exportNotificationTemplates(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesResponse.fromPartial({});
    const request2 = communityForumServiceApi.BatchCreateForumsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply2 = await upload<communityForumServiceApi.BatchCreateForumsRequest, communityForumServiceApi.BatchCreateForumsResponse>(
      (done) => this.communityForumClient.batchCreateForums(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    return experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Lists experiments a page at a time.
   */
  async listPendingExperiments(req: experimentsExperimentApprovalServiceApi.ListPendingExperimentsRequest): Promise<experimentsExperimentApprovalServiceApi.ListPendingExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingExperiments", req);
    this.logger.info("list_pending_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = performersPerformerQueryServiceApi.CountPerformersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const cloned1: performersPerformerQueryServiceApi.CountPerformersRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<performersPerformerQueryServiceApi.CountPerformersRequest, performersPerformerQueryServiceApi.CountPerformersResponse> =
      (input, done) => this.performersPerformerQueryClient.countPerformers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<performersPerformerQueryServiceApi.CountPerformersRequest, performersPerformerQueryServiceApi.CountPerformersResponse>(invoke1, cloned1);
    const request2 = auditAuditEventQueryServiceApi.FindAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const decoded2 = auditAuditEventQueryServiceApi.FindAuditEventsRequest.fromJSON(
      JSON.parse(JSON.stringify(auditAuditEventQueryServiceApi.FindAuditEventsRequest.toJSON(request2))),
    );
    const invoke2: Unary<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.findAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.ListPendingExperimentsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentApprovalServiceApi.ListPendingExperimentsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
    );
  }

  /**
   * Recalls an experiment.
   */
  async recallExperiment(req: experimentsExperimentApprovalServiceApi.RecallExperimentRequest): Promise<experimentsExperimentApprovalServiceApi.RecallExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "RecallExperiment", req);
    this.logger.info("recall_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request1 = notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest.fromPartial({
        context: req?.context,
        details: {
          contact: { preferredChannel: (item?.contact?.preferredChannel ?? "") },
        },
        notification: {
          requester: {
            email: (item?.contact?.email ?? ""),
            name: item?.contact?.name,
          },
        },
      });
      const invoke1: Unary<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse> =
        (input, done) => this.notificationsNotificationCalculationClient.explainNotificationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse.fromPartial({});
    const request2 = experimentsExperimentValidationServiceApi.GetExperimentRulesRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.experiment?.experimentId ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.GetExperimentRulesRequest",
      value: Buffer.from(experimentsExperimentValidationServiceApi.GetExperimentRulesRequest.encode(request2).finish()),
    });
    const unpacked2 = experimentsExperimentValidationServiceApi.GetExperimentRulesRequest.decode(envelope2.value);
    const invoke2: Unary<experimentsExperimentValidationServiceApi.GetExperimentRulesRequest, experimentsExperimentValidationServiceApi.GetExperimentRulesResponse> =
      (input, done) => this.experimentsExperimentValidationClient.getExperimentRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentValidationServiceApi.GetExperimentRulesRequest, experimentsExperimentValidationServiceApi.GetExperimentRulesResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.RecallExperimentResponse.fromPartial({
        experiment: {
          location: { recipient: (reply2?.experiment?.location?.recipient ?? "") },
        },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      experimentsExperimentApprovalServiceApi.RecallExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          status: req?.experiment?.status,
        },
      }),
    );
  }

  /**
   * Rejects an experiment.
   */
  async rejectExperiment(req: experimentsExperimentApprovalServiceApi.RejectExperimentRequest): Promise<experimentsExperimentApprovalServiceApi.RejectExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "RejectExperiment", req);
    this.logger.info("reject_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventQueryServiceApi.ResolveAuditEventsRequest.fromPartial({ context: req?.context });
    const client1 = this.clients.get<auditAuditEventQueryServiceApi.AuditEventQueryServiceClient>("acme.audit.v1.AuditEventQueryService");
    const invoke1: Unary<auditAuditEventQueryServiceApi.ResolveAuditEventsRequest, auditAuditEventQueryServiceApi.ResolveAuditEventsResponse> =
      (input, done) => client1.resolveAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventQueryServiceApi.ResolveAuditEventsRequest, auditAuditEventQueryServiceApi.ResolveAuditEventsResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request2 = maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: req?.experiment?.audit?.updatedAt,
          labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
          ownerId: (item?.participantId ?? ""),
          region: (req?.experiment?.location?.region ?? ""),
        },
      });
      const invoke2: Unary<maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse> =
        (input, done) => this.maintenanceWorkOrderQueryClient.browseWorkOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.RejectExperimentResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExperimentApprovalServiceApi.RejectExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Submits an experiment.
   */
  async submitExperiment(req: experimentsExperimentApprovalServiceApi.SubmitExperimentRequest): Promise<experimentsExperimentApprovalServiceApi.SubmitExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "SubmitExperiment", req);
    this.logger.info("submit_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      experiment: {
        recurrence: { $case: "daily", daily: {
          interval: ((req?.experiment?.recurrence?.$case === "weekly" ? req?.experiment?.recurrence.weekly : undefined)?.interval ?? 0),
        } },
        participants: [{ contact: { email: (req?.details?.approver?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      exposure: {
        subject: {
          displayName: (reply1?.experiment?.organizer?.displayName ?? ""),
          experimentId: (req?.experimentId ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse> =
      (input, done) => this.experimentsExposureImportClient.mapExposureImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse>(invoke2, request2));
    const tasks3: Array<() => Promise<experimentsExposureReportingServiceApi.ListExposureReportsResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks3.push(async () => {
        const request3 = experimentsExposureReportingServiceApi.ListExposureReportsRequest.fromPartial({
          context: req?.context,
          filter: {
            ownerId: (item?.participantId ?? ""),
            region: (req?.experiment?.location?.region ?? ""),
          },
        });
        const invoke3: Unary<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse> =
          (input, done) => this.experimentsExposureReportingClient.listExposureReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? experimentsExposureReportingServiceApi.ListExposureReportsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentApprovalServiceApi.SubmitExperimentResponse.fromPartial({
        experiment: { metadata: (reply1?.experiment?.metadata ?? {}) },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      experimentsExperimentApprovalServiceApi.SubmitExperimentResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      experimentsExperimentApprovalServiceApi.SubmitExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          window: req?.experiment?.window,
        },
      }),
    );
  }
}
