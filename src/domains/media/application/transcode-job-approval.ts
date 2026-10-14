/**
 * Routes transcode jobs through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as itsmIncidentCalculationServiceApi from "../../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import * as loyaltyLoyaltyMemberCalculationServiceApi from "../../../../.cache/proto/acme/loyalty/v1/loyalty_member_calculation_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobApprovalWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffWorkflowService") private readonly chatHandoffWorkflowClient: chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.itsm.v1.IncidentCalculationService") private readonly itsmIncidentCalculationClient: itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient,
    @inject("grpc:acme.loyalty.v1.LoyaltyMemberCalculationService") private readonly loyaltyLoyaltyMemberCalculationClient: loyaltyLoyaltyMemberCalculationServiceApi.LoyaltyMemberCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetApprovalService") private readonly mediaMediaAssetApprovalClient: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetReportingService") private readonly mediaMediaAssetReportingClient: mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.suppliers.v1.SupplierQueryService") private readonly suppliersSupplierQueryClient: suppliersSupplierQueryServiceApi.SupplierQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a transcode job.
   */
  async approveTranscodeJob(req: mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobRequest): Promise<mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ApproveTranscodeJob", req);
    this.logger.info("approve_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.transcodeJob?.customFields ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.generateMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest.fromPartial({
      context: req?.context,
      mediaAsset: { owner: { email: (req?.transcodeJob?.requester?.email ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>(
      "acme.media.v1.TranscodeJobApprovalService/ApproveTranscodeJob:1", request2,
    );
    const request3 = mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply2?.mediaAsset?.owner?.email ?? ""),
          name: req?.transcodeJob?.requester?.name,
        },
      },
    });
    const invoke3: Unary<mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.shareMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse>(invoke3, request3));
    const settled4 = await Promise.allSettled((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request4 = customersCustomerQueryServiceApi.FindCustomersRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.changedAt,
          labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
          ownerId: (reply3?.mediaAsset?.owner?.userId ?? ""),
          region: ((reply2?.mediaAsset?.locator?.$case === "address" ? reply2?.mediaAsset?.locator.address : undefined)?.region ?? ""),
        },
      });
      const invoke4: Unary<customersCustomerQueryServiceApi.FindCustomersRequest, customersCustomerQueryServiceApi.FindCustomersResponse> =
        (input, done) => this.customersCustomerQueryClient.findCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<customersCustomerQueryServiceApi.FindCustomersRequest, customersCustomerQueryServiceApi.FindCustomersResponse>(invoke4, request4);
      return reply4;
    }));
    const results4: customersCustomerQueryServiceApi.FindCustomersResponse[] = [];
    for (const result of settled4) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results4.push(result.value);
    }
    const reply4 = results4.at(-1) ?? customersCustomerQueryServiceApi.FindCustomersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        transcodeJob: {
          assignee: { displayName: (reply2?.mediaAsset?.owner?.displayName ?? "") },
        },
      }),
      mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a transcode job.
   */
  async commentTranscodeJobApproval(req: mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest): Promise<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "CommentTranscodeJobApproval", req);
    this.logger.info("comment_transcode_job_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = suppliersSupplierQueryServiceApi.SummarizeSuppliersRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<suppliersSupplierQueryServiceApi.SummarizeSuppliersRequest, suppliersSupplierQueryServiceApi.SummarizeSuppliersResponse> =
      (input, done) => this.suppliersSupplierQueryClient.summarizeSuppliers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<suppliersSupplierQueryServiceApi.SummarizeSuppliersResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: { createdAt: req?.transcodeJob?.audit?.createdAt },
        owner: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest, mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.reconcileMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    let selected3_3: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected3_3 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest.fromPartial({
      context: req?.context,
      rendition: {
        components: { primary: {
          componentId: (reply2?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
        } },
        dimensions: { weight: (reply2?.mediaAsset?.dimensions?.weight ?? 0) },
        owner: { email: (selected3_3 ?? "") },
      },
    });
    const invoke3: Unary<mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest, mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse> =
      (input, done) => this.mediaRenditionSyncClient.resolveRenditionConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest, mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse>(invoke3, request3);
    const request4 = mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        origin: { $case: "customer", customer: { email: (req?.details?.approver?.email ?? "") } },
      },
    });
    const method4 = "validateTranscodeJobImport" as const;
    const invoke4: Unary<mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse> =
      (input, done) => this.mediaTranscodeJobImportClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse>(invoke4, request4);
    const request5 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream5 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.approver?.userId ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        transcodeJob: { tags: (reply3?.rendition?.tags ?? []) },
      }),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse.fromPartial({
        transcodeJob: {
          subject: (req?.transcodeJob?.subject ?? ""),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a transcode job.
   */
  async delegateTranscodeJobApproval(req: mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalRequest): Promise<mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "DelegateTranscodeJobApproval", req);
    this.logger.info("delegate_transcode_job_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse>> = [];
    for (const item of (req?.transcodeJob?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest.fromPartial({
          context: req?.context,
          transcodeJob: {
            audit: { createdAt: item?.createdAt },
            comments: [{
              authorEmail: (item?.authorEmail ?? ""),
              body: (item?.body ?? ""),
              commentId: (item?.commentId ?? ""),
            }],
          },
        });
        const invoke1: Unary<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse> =
          (input, done) => this.mediaTranscodeJobImportClient.retryTranscodeJobImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse.fromPartial({});
    const request2 = admissionsAdmissionCalculationServiceApi.CompareAdmissionOptionsRequest.fromPartial({
      admission: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: {
          displayName: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy2 = forwarding(this.admissionsAdmissionCalculationClient);
    const invoke2: Unary<admissionsAdmissionCalculationServiceApi.CompareAdmissionOptionsRequest, admissionsAdmissionCalculationServiceApi.CompareAdmissionOptionsResponse> =
      (input, done) => proxy2.compareAdmissionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<admissionsAdmissionCalculationServiceApi.CompareAdmissionOptionsRequest, admissionsAdmissionCalculationServiceApi.CompareAdmissionOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalResponse.fromPartial({
        transcodeJob: {
          requester: req?.transcodeJob?.requester,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a transcode job.
   */
  async escalateTranscodeJob(req: mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest): Promise<mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "EscalateTranscodeJob", req);
    this.logger.info("escalate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.transcodeJob?.assignee?.displayName ?? ""),
          email: (req?.transcodeJob?.assignee?.email ?? ""),
        },
      },
      mediaAsset: { owner: { userId: (req?.transcodeJob?.assignee?.userId ?? "") } },
    });
    const invoke1: Unary<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.commentMediaAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse>(invoke1, request1);
    const request2 = mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { userId: (req?.transcodeJob?.assignee?.userId ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.details?.approver?.displayName ?? "") } },
        sla: { policyId: (req?.transcodeJob?.sla?.policyId ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobSyncClient.reconcileTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async getTranscodeJobApprovalStatus(req: mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusRequest): Promise<mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobApprovalStatus", req);
    this.logger.info("get_transcode_job_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest.fromPartial({
      context: input1?.context,
      details: {
        approver: {
          email: (input1?.context?.actor?.email ?? ""),
          userId: (input1?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.commentMediaAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = customersHouseholdValidationServiceApi.NormalizeHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") },
            location: { locality: (selected2_1 ?? "") },
            manager: { displayName: (reply1?.mediaAsset?.owner?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.normalizeHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse>(invoke2, request2);
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse.fromPartial({
        transcodeJob: { audit: { createdAt: reply1?.mediaAsset?.audit?.createdAt } },
      }),
      mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse.fromPartial({
        result: { status: (reply2?.result?.status ?? "") },
        transcodeJob: { requester: { email: (reply2?.household?.manager?.email ?? "") } },
      }),
      mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Lists transcode jobs a page at a time.
   */
  async listPendingTranscodeJobs(req: mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest): Promise<mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingTranscodeJobs", req);
    this.logger.info("list_pending_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = itsmIncidentCalculationServiceApi.SimulateIncidentRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const decoded1 = itsmIncidentCalculationServiceApi.SimulateIncidentRequest.fromJSON(
      JSON.parse(JSON.stringify(itsmIncidentCalculationServiceApi.SimulateIncidentRequest.toJSON(request1))),
    );
    const invoke1: Unary<itsmIncidentCalculationServiceApi.SimulateIncidentRequest, itsmIncidentCalculationServiceApi.SimulateIncidentResponse> =
      (input, done) => this.itsmIncidentCalculationClient.simulateIncident(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<itsmIncidentCalculationServiceApi.SimulateIncidentRequest, itsmIncidentCalculationServiceApi.SimulateIncidentResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsResponse.fromPartial({ transcodeJobs: [{ sla: { dueAt: reply1?.incident?.sla?.dueAt } }] });
  }

  /**
   * Recalls a transcode job.
   */
  async recallTranscodeJob(req: mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobRequest): Promise<mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "RecallTranscodeJob", req);
    this.logger.info("recall_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request1 = chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowRequest.fromPartial({
        context: req?.context,
        handoff: {
          history: [{
            changedAt: item?.changedAt,
            changedBy: (item?.changedBy ?? ""),
            fromStatus: (item?.fromStatus ?? ""),
            toStatus: (item?.toStatus ?? ""),
          }],
        },
      });
      const invoke1: Unary<chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse> =
        (input, done) => this.chatHandoffWorkflowClient.resumeHandoffWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse.fromPartial({});
    const request2 = customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { etag: (reply1?.handoff?.audit?.etag ?? "") },
            manager: {
              displayName: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? ""),
              email: (req?.details?.approver?.email ?? ""),
            },
          }],
        }],
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.CheckHouseholdEligibilityRequest",
      value: Buffer.from(customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.encode(request2).finish()),
    });
    const unpacked2 = customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.decode(envelope2.value);
    const invoke2: Unary<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse> =
      (input, done) => this.customersHouseholdValidationClient.checkHouseholdEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse>(invoke2, unpacked2);
    const settled3 = await Promise.allSettled((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request3 = customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest.fromPartial({
        context: req?.context,
        customerSegment: { audit: { createdAt: item?.createdAt } },
      });
      const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> =
        (input, done) => this.customersCustomerSegmentCalculationClient.simulateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse.fromPartial({});
    const request4 = featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.handoff?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (reply2?.household?.location?.region ?? ""),
      },
    });
    const client4 = this.clients.get<featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient>("acme.featureflags.v1.FeatureFlagService");
    const invoke4: Unary<featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.ListFeatureFlagsResponse> =
      (input, done) => client4.listFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.ListFeatureFlagsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse.fromPartial({
        transcodeJob: {
          subject: (req?.transcodeJob?.subject ?? ""),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a transcode job.
   */
  async rejectTranscodeJob(req: mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest): Promise<mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "RejectTranscodeJob", req);
    this.logger.info("reject_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostWorkflowServiceApi.ResumePostWorkflowRequest.fromPartial({
      context: req?.context,
      post: { audit: { updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? "") } },
    });
    const invoke1: Unary<communityPostWorkflowServiceApi.ResumePostWorkflowRequest, communityPostWorkflowServiceApi.ResumePostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.resumePostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityPostWorkflowServiceApi.ResumePostWorkflowRequest, communityPostWorkflowServiceApi.ResumePostWorkflowResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { postalCode: (reply1?.post?.billingAddress?.postalCode ?? "") } },
      },
    });
    const invoke2: Unary<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.syncMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (reply2?.mediaAsset?.locator?.$case) {
      case "address":
        selected3_1 = ((reply2?.mediaAsset?.locator?.$case === "address" ? reply2?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = loyaltyLoyaltyMemberCalculationServiceApi.SimulateLoyaltyMemberRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (selected3_1 ?? "") } },
      loyaltyMember: { audit: { updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? "") } },
    });
    const invoke3: Unary<loyaltyLoyaltyMemberCalculationServiceApi.SimulateLoyaltyMemberRequest, loyaltyLoyaltyMemberCalculationServiceApi.SimulateLoyaltyMemberResponse> =
      (input, done) => this.loyaltyLoyaltyMemberCalculationClient.simulateLoyaltyMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<loyaltyLoyaltyMemberCalculationServiceApi.SimulateLoyaltyMemberRequest, loyaltyLoyaltyMemberCalculationServiceApi.SimulateLoyaltyMemberResponse>(invoke3, request3);
    const request4 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          email: (req?.transcodeJob?.requester?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        audit: { createdAt: reply3?.loyaltyMember?.audit?.createdAt },
      },
    });
    const invoke4: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.compareNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse.fromPartial({
        transcodeJob: { assignee: { email: (reply3?.loyaltyMember?.contact?.email ?? "") } },
      }),
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse.fromPartial({ transcodeJob: { sla: { dueAt: reply4?.notification?.sla?.dueAt } } }),
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse.fromPartial({
        transcodeJob: {
          status: req?.transcodeJob?.status,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a transcode job.
   */
  async submitTranscodeJob(req: mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobRequest): Promise<mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "SubmitTranscodeJob", req);
    this.logger.info("submit_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: { updatedAt: req?.transcodeJob?.audit?.updatedAt },
        relationshipManager: { email: (req?.transcodeJob?.assignee?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest, customersCustomerCalculationServiceApi.ExplainCustomerCalculationResponse>(
      "acme.media.v1.TranscodeJobApprovalService/SubmitTranscodeJob:0", request1,
    );
    const request2 = mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        owner: { userId: (reply1?.customer?.relationshipManager?.userId ?? "") },
      },
    });
    const invoke2: Unary<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.escalateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse>(invoke2, request2));
    const request3 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        owner: {
          displayName: (req?.transcodeJob?.assignee?.displayName ?? ""),
          userId: (reply1?.customer?.relationshipManager?.userId ?? ""),
        },
      },
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke3: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse.fromPartial({
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
        transcodeJob: {
          requester: { preferredChannel: (reply1?.customer?.contact?.preferredChannel ?? "") },
        },
      }),
      mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse.fromPartial({
        transcodeJob: {
          status: req?.transcodeJob?.status,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }
}
