/**
 * Routes exposures through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as patientsPatientServiceApi from "../../../../.cache/proto/acme/patients/v1/patient_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as ticketingTicketQueryServiceApi from "../../../../.cache/proto/acme/ticketing/v1/ticket_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExposureRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureApprovalWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentLifecycleService") private readonly experimentsExperimentLifecycleClient: experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureLifecycleService") private readonly experimentsExposureLifecycleClient: experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.patients.v1.PatientService") private readonly patientsPatientClient: patientsPatientServiceApi.PatientServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketQueryService") private readonly ticketingTicketQueryClient: ticketingTicketQueryServiceApi.TicketQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an exposure.
   */
  async approveExposure(req: experimentsExposureApprovalServiceApi.ApproveExposureRequest): Promise<experimentsExposureApprovalServiceApi.ApproveExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ApproveExposure", req);
    this.logger.info("approve_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.BatchCreateDocumentsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.exposure?.source ?? ""),
        submittedBy: { email: (req?.details?.approver?.email ?? "") },
      } },
    });
    const reply1 = await upload<documentsDocumentServiceApi.BatchCreateDocumentsRequest, documentsDocumentServiceApi.BatchCreateDocumentsResponse>(
      (done) => this.documentsDocumentClient.batchCreateDocuments(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    const settled2 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = patientsPatientServiceApi.UpdatePatientRequest.fromPartial({
        context: req?.context,
        patient: {
          audit: { updatedAt: item?.observedAt },
          relationshipManager: {
            displayName: (req?.details?.approver?.displayName ?? ""),
            userId: (req?.details?.approver?.userId ?? ""),
          },
        },
      });
      const invoke2: Unary<patientsPatientServiceApi.UpdatePatientRequest, patientsPatientServiceApi.UpdatePatientResponse> =
        (input, done) => this.patientsPatientClient.updatePatient(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<patientsPatientServiceApi.UpdatePatientRequest, patientsPatientServiceApi.UpdatePatientResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: patientsPatientServiceApi.UpdatePatientResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? patientsPatientServiceApi.UpdatePatientResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExposureApprovalServiceApi.ApproveExposureResponse.fromPartial({
      exposure: {
        exposureId: (req?.exposureId ?? ""),
        subject: req?.exposure?.subject,
      },
    });
  }

  /**
   * Delegates an exposure.
   */
  async delegateExposureApproval(req: experimentsExposureApprovalServiceApi.DelegateExposureApprovalRequest): Promise<experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "DelegateExposureApproval", req);
    this.logger.info("delegate_exposure_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = ticketingTicketQueryServiceApi.SummarizeTicketsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      context: input1?.context,
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<ticketingTicketQueryServiceApi.SummarizeTicketsRequest, ticketingTicketQueryServiceApi.SummarizeTicketsResponse> =
      (input, done) => this.ticketingTicketQueryClient.summarizeTickets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ticketingTicketQueryServiceApi.SummarizeTicketsRequest, ticketingTicketQueryServiceApi.SummarizeTicketsResponse>(invoke1, request1);
    const request2 = experimentsVariantSyncServiceApi.ListVariantConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.exposure?.subject?.startsAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const cloned2: experimentsVariantSyncServiceApi.ListVariantConflictsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse> =
      (input, done) => this.experimentsVariantSyncClient.listVariantConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse>(invoke2, cloned2);
    const request3 = experimentsExposureImportServiceApi.GetExposureImportStatusRequest.fromPartial({
      context: req?.context,
      exposureId: (req?.exposure?.exposureId ?? ""),
    });
    const decoded3 = experimentsExposureImportServiceApi.GetExposureImportStatusRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExposureImportServiceApi.GetExposureImportStatusRequest.toJSON(request3))),
    );
    const invoke3: Unary<experimentsExposureImportServiceApi.GetExposureImportStatusRequest, experimentsExposureImportServiceApi.GetExposureImportStatusResponse> =
      (input, done) => this.experimentsExposureImportClient.getExposureImportStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureImportServiceApi.GetExposureImportStatusRequest, experimentsExposureImportServiceApi.GetExposureImportStatusResponse>(invoke3, decoded3);
    const results4 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request4 = metricsMetricSeriesServiceApi.WatchMetricSeriesesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
        subscriber: { email: (req?.details?.approver?.email ?? "") },
      });
      const stream4 = this.metricsMetricSeriesClient.watchMetricSerieses(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
      const messages4 = await collect(stream4);
      const reply4 = messages4.at(-1) ?? metricsMetricSeriesServiceApi.WatchMetricSeriesesResponse.fromPartial({});
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? metricsMetricSeriesServiceApi.WatchMetricSeriesesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse.fromPartial({ exposure: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates an exposure.
   */
  async escalateExposure(req: experimentsExposureApprovalServiceApi.EscalateExposureRequest): Promise<experimentsExposureApprovalServiceApi.EscalateExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "EscalateExposure", req);
    this.logger.info("escalate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: { organizer: { email: (req?.details?.approver?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.SimulateExperimentRequest",
      value: Buffer.from(experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.simulateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse>(invoke1, unpacked1);
    const request2 = communityPostWorkflowServiceApi.AdvancePostWorkflowRequest.fromPartial({
      context: req?.context,
      post: { audit: { createdAt: reply1?.experiment?.audit?.createdAt } },
    });
    const client2 = this.clients.get<communityPostWorkflowServiceApi.PostWorkflowServiceClient>("acme.community.v1.PostWorkflowService");
    const invoke2: Unary<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse> =
      (input, done) => client2.advancePostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>(invoke2, request2);
    const request3 = experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (reply1?.experiment?.organizer?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (reply2?.post?.counterparty?.email ?? "") },
      },
      experimentId: (req?.exposure?.subject?.experimentId ?? ""),
    });
    const invoke3: Unary<experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest, experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse> =
      (input, done) => this.experimentsExperimentLifecycleClient.expireExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest, experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = experimentsExperimentServiceApi.CloneExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { createdAt: reply3?.experiment?.audit?.createdAt },
        organizer: { displayName: (reply2?.post?.counterparty?.displayName ?? "") },
      },
    });
    const invoke4: Unary<experimentsExperimentServiceApi.CloneExperimentRequest, experimentsExperimentServiceApi.CloneExperimentResponse> =
      (input, done) => this.experimentsExperimentClient.cloneExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<experimentsExperimentServiceApi.CloneExperimentRequest, experimentsExperimentServiceApi.CloneExperimentResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.EscalateExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsExposureApprovalServiceApi.EscalateExposureResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      experimentsExposureApprovalServiceApi.EscalateExposureResponse.fromPartial({ outcome: { effectiveAt: reply3?.outcome?.effectiveAt } }),
      experimentsExposureApprovalServiceApi.EscalateExposureResponse.fromPartial({
        exposure: { correlationId: (reply4?.result?.correlationId ?? "") },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      experimentsExposureApprovalServiceApi.EscalateExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          sequence: (req?.exposure?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Returns an exposure.
   */
  async getExposureApprovalStatus(req: experimentsExposureApprovalServiceApi.GetExposureApprovalStatusRequest): Promise<experimentsExposureApprovalServiceApi.GetExposureApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExposureApprovalStatus", req);
    this.logger.info("get_exposure_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureSyncServiceApi.ResolveExposureConflictRequest.fromPartial({
      context: req?.context,
      exposure: { exposureId: (req?.exposureId ?? "") },
    });
    const invoke1: Unary<experimentsExposureSyncServiceApi.ResolveExposureConflictRequest, experimentsExposureSyncServiceApi.ResolveExposureConflictResponse> =
      (input, done) => this.experimentsExposureSyncClient.resolveExposureConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetExposureApprovalStatus.ResolveExposureConflict", () => call<experimentsExposureSyncServiceApi.ResolveExposureConflictRequest, experimentsExposureSyncServiceApi.ResolveExposureConflictResponse>(invoke1, request1));
    const request2 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.fromPartial({
      context: req?.context,
      exposure: {
        occurredAt: reply1?.exposure?.occurredAt,
        sequence: (reply1?.exposure?.sequence ?? 0),
        subject: {
          displayName: (reply1?.exposure?.subject?.displayName ?? ""),
          experimentId: (reply1?.exposure?.subject?.experimentId ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.validateExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    return mergeResponses(
      experimentsExposureApprovalServiceApi.GetExposureApprovalStatusResponse.fromPartial({
        exposure: {
          subject: { displayName: (reply1?.exposure?.subject?.displayName ?? "") },
        },
      }),
      experimentsExposureApprovalServiceApi.GetExposureApprovalStatusResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      experimentsExposureApprovalServiceApi.GetExposureApprovalStatusResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Lists exposures a page at a time.
   */
  async listPendingExposures(req: experimentsExposureApprovalServiceApi.ListPendingExposuresRequest): Promise<experimentsExposureApprovalServiceApi.ListPendingExposuresResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingExposures", req);
    this.logger.info("list_pending_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.ListAffinityReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const reply1 = await this.workQueue.enqueue<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse>(
      "acme.experiments.v1.ExposureApprovalService/ListPendingExposures:0", request1,
    );
    const request2 = authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.validateAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.ListPendingExposuresResponse.fromPartial({
        pageInfo: {
          nextPageToken: (reply1?.pageInfo?.nextPageToken ?? ""),
          totalSize: (reply1?.pageInfo?.totalSize ?? 0),
        },
      }),
      experimentsExposureApprovalServiceApi.ListPendingExposuresResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Recalls an exposure.
   */
  async recallExposure(req: experimentsExposureApprovalServiceApi.RecallExposureRequest): Promise<experimentsExposureApprovalServiceApi.RecallExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "RecallExposure", req);
    this.logger.info("recall_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.PreviewExposureRequest.fromPartial({
      context: req?.context,
      exposure: { subject: { startsAt: req?.exposure?.subject?.startsAt } },
    });
    const invoke1: Unary<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.previewExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExposureValidationServiceApi.PreviewExposureResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = searchSearchIndexQueryServiceApi.FindSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply1?.exposure?.subject?.startsAt },
    });
    const invoke2: Unary<searchSearchIndexQueryServiceApi.FindSearchIndexesRequest, searchSearchIndexQueryServiceApi.FindSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.findSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply1?.exposure?.subject?.startsAt },
    });
    const invoke3: Unary<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.suggestMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.RecallExposureResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExposureApprovalServiceApi.RecallExposureResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      experimentsExposureApprovalServiceApi.RecallExposureResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      experimentsExposureApprovalServiceApi.RecallExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          source: (req?.exposure?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects an exposure.
   */
  async rejectExposure(req: experimentsExposureApprovalServiceApi.RejectExposureRequest): Promise<experimentsExposureApprovalServiceApi.RejectExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "RejectExposure", req);
    this.logger.info("reject_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureLifecycleServiceApi.ReinstateExposureRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      exposureId: (req?.exposureId ?? ""),
    });
    const method1 = "reinstateExposure" as const;
    const invoke1: Unary<experimentsExposureLifecycleServiceApi.ReinstateExposureRequest, experimentsExposureLifecycleServiceApi.ReinstateExposureResponse> =
      (input, done) => this.experimentsExposureLifecycleClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureLifecycleServiceApi.ReinstateExposureRequest, experimentsExposureLifecycleServiceApi.ReinstateExposureResponse>(invoke1, request1);
    const request2 = personalizationProfileApprovalServiceApi.RejectProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        relationshipManager: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const proxy2 = forwarding(this.personalizationProfileApprovalClient);
    const invoke2: Unary<personalizationProfileApprovalServiceApi.RejectProfileRequest, personalizationProfileApprovalServiceApi.RejectProfileResponse> =
      (input, done) => proxy2.rejectProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileApprovalServiceApi.RejectProfileRequest, personalizationProfileApprovalServiceApi.RejectProfileResponse>(invoke2, request2);
    const results3 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request3 = metricsMetricSeriesServiceApi.WatchMetricSeriesesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
        subscriber: {
          email: (reply2?.profile?.contact?.email ?? ""),
          name: reply2?.profile?.contact?.name,
        },
      });
      const stream3 = this.metricsMetricSeriesClient.watchMetricSerieses(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
      const messages3 = await collect(stream3);
      const reply3 = messages3.at(-1) ?? metricsMetricSeriesServiceApi.WatchMetricSeriesesResponse.fromPartial({});
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? metricsMetricSeriesServiceApi.WatchMetricSeriesesResponse.fromPartial({});
    const tasks4: Array<() => Promise<experimentsExperimentReportingServiceApi.ListExperimentReportsResponse>> = [];
    for (const item of (req?.exposure?.measurements ?? [])) {
      tasks4.push(async () => {
        const request4 = experimentsExperimentReportingServiceApi.ListExperimentReportsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
            ownerId: (reply2?.profile?.relationshipManager?.userId ?? ""),
            region: (reply2?.profile?.primaryAddress?.region ?? ""),
          },
        });
        const invoke4: Unary<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse> =
          (input, done) => this.experimentsExperimentReportingClient.listExperimentReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply4 = await call<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse>(invoke4, request4);
        return reply4;
      });
    }
    const results4 = await Promise.all(tasks4.map((task) => task()));
    const reply4 = results4.at(-1) ?? experimentsExperimentReportingServiceApi.ListExperimentReportsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.RejectExposureResponse.fromPartial({
        result: {
          correlationId: (reply1?.exposure?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      experimentsExposureApprovalServiceApi.RejectExposureResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      experimentsExposureApprovalServiceApi.RejectExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Submits an exposure.
   */
  async submitExposure(req: experimentsExposureApprovalServiceApi.SubmitExposureRequest): Promise<experimentsExposureApprovalServiceApi.SubmitExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "SubmitExposure", req);
    this.logger.info("submit_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.EscalateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            attributes: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
            manager: { displayName: (req?.details?.approver?.displayName ?? "") },
          }],
          manager: { email: (req?.details?.approver?.email ?? "") },
        }],
        manager: { displayName: (req?.exposure?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse> =
      (input, done) => this.communityForumApprovalClient.escalateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureApprovalServiceApi.SubmitExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { message: (reply1?.outcome?.message ?? "") },
      }),
      experimentsExposureApprovalServiceApi.SubmitExposureResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ExposureApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureApprovalHandler {
  constructor(@inject(ExposureApprovalWorkflow) private readonly workflow: ExposureApprovalWorkflow) {}

  /**
   * Approves an exposure.
   */
  approveExposure = unary<experimentsExposureApprovalServiceApi.ApproveExposureRequest, experimentsExposureApprovalServiceApi.ApproveExposureResponse>(
    (request) => this.workflow.approveExposure(request),
  );

  /**
   * Delegates an exposure.
   */
  delegateExposureApproval = unary<experimentsExposureApprovalServiceApi.DelegateExposureApprovalRequest, experimentsExposureApprovalServiceApi.DelegateExposureApprovalResponse>(
    (request) => this.workflow.delegateExposureApproval(request),
  );

  /**
   * Escalates an exposure.
   */
  escalateExposure = (call: ServerUnaryCall<experimentsExposureApprovalServiceApi.EscalateExposureRequest, experimentsExposureApprovalServiceApi.EscalateExposureResponse>, done: sendUnaryData<experimentsExposureApprovalServiceApi.EscalateExposureResponse>): void => {
    void this.workflow.escalateExposure(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an exposure.
   */
  getExposureApprovalStatus = unary<experimentsExposureApprovalServiceApi.GetExposureApprovalStatusRequest, experimentsExposureApprovalServiceApi.GetExposureApprovalStatusResponse>(
    (request) => this.workflow.getExposureApprovalStatus(request),
  );

  /**
   * Lists exposures a page at a time.
   */
  listPendingExposures = unary<experimentsExposureApprovalServiceApi.ListPendingExposuresRequest, experimentsExposureApprovalServiceApi.ListPendingExposuresResponse>(
    (request) => this.workflow.listPendingExposures(request),
  );

  /**
   * Recalls an exposure.
   */
  recallExposure = (call: ServerUnaryCall<experimentsExposureApprovalServiceApi.RecallExposureRequest, experimentsExposureApprovalServiceApi.RecallExposureResponse>, done: sendUnaryData<experimentsExposureApprovalServiceApi.RecallExposureResponse>): void => {
    void this.workflow.recallExposure(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects an exposure.
   */
  rejectExposure = unary<experimentsExposureApprovalServiceApi.RejectExposureRequest, experimentsExposureApprovalServiceApi.RejectExposureResponse>(
    (request) => this.workflow.rejectExposure(request),
  );

  /**
   * Submits an exposure.
   */
  submitExposure = unary<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse>(
    (request) => this.workflow.submitExposure(request),
  );
}

export function implementation(handler: ExposureApprovalHandler): experimentsExposureApprovalServiceApi.ExposureApprovalServiceServer {
  return {
    approveExposure: handler.approveExposure,
    delegateExposureApproval: handler.delegateExposureApproval,
    escalateExposure: handler.escalateExposure,
    getExposureApprovalStatus: handler.getExposureApprovalStatus,
    listPendingExposures: handler.listPendingExposures,
    recallExposure: handler.recallExposure,
    rejectExposure: handler.rejectExposure,
    submitExposure: handler.submitExposure,
  };
}
