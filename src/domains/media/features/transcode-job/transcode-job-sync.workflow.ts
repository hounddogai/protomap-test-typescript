/**
 * Keeps transcode jobs in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as billingBillingAccountQueryServiceApi from "../../../../../.cache/proto/acme/billing/v1/billing_account_query_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as customersCustomerQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as licensingSoftwareLicenseQueryServiceApi from "../../../../../.cache/proto/acme/licensing/v1/software_license_query_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as paymentsPaymentCalculationServiceApi from "../../../../../.cache/proto/acme/payments/v1/payment_calculation_service.js";
import * as payrollPayRunServiceApi from "../../../../../.cache/proto/acme/payroll/v1/pay_run_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobSyncWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.billing.v1.BillingAccountQueryService") private readonly billingBillingAccountQueryClient: billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomWorkflowService") private readonly chatChatRoomWorkflowClient: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.licensing.v1.SoftwareLicenseQueryService") private readonly licensingSoftwareLicenseQueryClient: licensingSoftwareLicenseQueryServiceApi.SoftwareLicenseQueryServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.payments.v1.PaymentCalculationService") private readonly paymentsPaymentCalculationClient: paymentsPaymentCalculationServiceApi.PaymentCalculationServiceClient,
    @inject("grpc:acme.payroll.v1.PayRunService") private readonly payrollPayRunClient: payrollPayRunServiceApi.PayRunServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a transcode job.
   */
  async getTranscodeJobSyncState(req: mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateRequest): Promise<mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobSyncState", req);
    this.logger.info("get_transcode_job_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentValidationServiceApi.PreviewDocumentRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const proxy1 = forwarding(this.documentsDocumentValidationClient);
    const invoke1: Unary<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse> =
      (input, done) => proxy1.previewDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse>(invoke1, request1);
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateResponse.fromPartial({
        result: { message: (reply1?.result?.message ?? "") },
        transcodeJob: { audit: { createdAt: reply1?.document?.audit?.createdAt } },
      }),
      mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Lists transcode jobs a page at a time.
   */
  async listTranscodeJobConflicts(req: mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest): Promise<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranscodeJobConflicts", req);
    this.logger.info("list_transcode_job_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.estimateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse>(invoke1, request1);
    const request2 = mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      transcodeJob: { audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.simulateTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse.fromPartial({
        transcodeJobs: [{ requester: { email: (reply2?.transcodeJob?.assignee?.email ?? "") } }],
      }),
    );
  }

  /**
   * Pulls a transcode job.
   */
  async pullTranscodeJobs(req: mediaTranscodeJobSyncServiceApi.PullTranscodeJobsRequest): Promise<mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "PullTranscodeJobs", req);
    this.logger.info("pull_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest.fromPartial({
      chatRoom: {
        audit: {
          createdBy: (input1?.transcodeJob?.audit?.createdBy ?? ""),
          updatedBy: (input1?.transcodeJob?.audit?.updatedBy ?? ""),
        },
        owner: {
          email: (input1?.transcodeJob?.assignee?.email ?? ""),
          userId: (input1?.transcodeJob?.assignee?.userId ?? ""),
        },
      },
      context: input1?.context,
    });
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse> =
      (input, done) => this.chatChatRoomWorkflowClient.startChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse>(invoke1, request1);
    const request2 = featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.transcodeJob?.requester?.email ?? ""),
          name: req?.transcodeJob?.requester?.name,
        },
      },
      featureFlag: {
        audit: {
          createdBy: (req?.transcodeJob?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? ""),
        },
      },
    });
    const cloned2: featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.checkFeatureFlagEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse.fromPartial({
        result: { status: (reply1?.outcome?.status ?? "") },
        transcodeJob: {
          assignee: { displayName: (reply1?.chatRoom?.owner?.displayName ?? "") },
        },
      }),
      mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse.fromPartial({
        result: { message: (reply2?.outcome?.message ?? "") },
        transcodeJob: { audit: { updatedBy: (reply2?.featureFlag?.audit?.updatedBy ?? "") } },
      }),
      mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a transcode job.
   */
  async pushTranscodeJob(req: mediaTranscodeJobSyncServiceApi.PushTranscodeJobRequest): Promise<mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "PushTranscodeJob", req);
    this.logger.info("push_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.SuggestCustomersRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.transcodeJob?.sla?.dueAt },
    });
    const decoded1 = customersCustomerQueryServiceApi.SuggestCustomersRequest.fromJSON(
      JSON.parse(JSON.stringify(customersCustomerQueryServiceApi.SuggestCustomersRequest.toJSON(request1))),
    );
    const invoke1: Unary<customersCustomerQueryServiceApi.SuggestCustomersRequest, customersCustomerQueryServiceApi.SuggestCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.suggestCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerQueryServiceApi.SuggestCustomersRequest, customersCustomerQueryServiceApi.SuggestCustomersResponse>(invoke1, decoded1);
    const request2 = paymentsPaymentCalculationServiceApi.SimulatePaymentRequest.fromPartial({
      context: req?.context,
      payment: {
        audit: { updatedAt: req?.transcodeJob?.audit?.updatedAt },
        counterparty: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.payments.v1.SimulatePaymentRequest",
      value: Buffer.from(paymentsPaymentCalculationServiceApi.SimulatePaymentRequest.encode(request2).finish()),
    });
    const unpacked2 = paymentsPaymentCalculationServiceApi.SimulatePaymentRequest.decode(envelope2.value);
    const invoke2: Unary<paymentsPaymentCalculationServiceApi.SimulatePaymentRequest, paymentsPaymentCalculationServiceApi.SimulatePaymentResponse> =
      (input, done) => this.paymentsPaymentCalculationClient.simulatePayment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<paymentsPaymentCalculationServiceApi.SimulatePaymentRequest, paymentsPaymentCalculationServiceApi.SimulatePaymentResponse>(invoke2, unpacked2);
    const tasks3: Array<() => Promise<customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityResponse>> = [];
    for (const item of (req?.transcodeJob?.comments ?? [])) {
      tasks3.push(async () => {
        const request3 = customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityRequest.fromPartial({
          context: req?.context,
          customerSegment: {
            audit: { createdAt: item?.createdAt },
            owner: { email: (item?.authorEmail ?? "") },
          },
        });
        const invoke3: Unary<customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityRequest, customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityResponse> =
          (input, done) => this.customersCustomerSegmentValidationClient.checkCustomerSegmentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityRequest, customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse.fromPartial({
        result: { status: (reply2?.result?.status ?? "") },
        transcodeJob: { comments: [{ createdAt: reply2?.payment?.audit?.createdAt }] },
      }),
      mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse.fromPartial({
        transcodeJob: {
          subject: (req?.transcodeJob?.subject ?? ""),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a transcode job.
   */
  async reconcileTranscodeJobs(req: mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest): Promise<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ReconcileTranscodeJobs", req);
    this.logger.info("reconcile_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "channel":
        selected1_2 = ((req?.transcodeJob?.origin?.$case === "channel" ? req?.transcodeJob?.origin.channel : undefined)?.channel ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { email: (req?.transcodeJob?.requester?.email ?? "") },
        origin: { $case: "channel", channel: { channel: (selected1_2 ?? "") } },
      },
    });
    const invoke1: Unary<mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsRequest, mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse> =
      (input, done) => this.mediaTranscodeJobImportClient.mapTranscodeJobImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsRequest, mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse>(invoke1, request1);
    const request2 = billingBillingAccountQueryServiceApi.FindBillingAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.transcodeJob?.audit?.updatedAt,
        ownerId: (reply1?.transcodeJob?.assignee?.userId ?? ""),
      },
    });
    const invoke2: Unary<billingBillingAccountQueryServiceApi.FindBillingAccountsRequest, billingBillingAccountQueryServiceApi.FindBillingAccountsResponse> =
      (input, done) => this.billingBillingAccountQueryClient.findBillingAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<billingBillingAccountQueryServiceApi.FindBillingAccountsRequest, billingBillingAccountQueryServiceApi.FindBillingAccountsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = payrollPayRunServiceApi.ListPayRunsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.transcodeJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.transcodeJob?.assignee?.userId ?? ""),
      },
    });
    const invoke3: Unary<payrollPayRunServiceApi.ListPayRunsRequest, payrollPayRunServiceApi.ListPayRunsResponse> =
      (input, done) => this.payrollPayRunClient.listPayRuns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<payrollPayRunServiceApi.ListPayRunsRequest, payrollPayRunServiceApi.ListPayRunsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          assignee: { email: (reply1?.transcodeJob?.assignee?.email ?? "") },
          tags: (reply1?.transcodeJob?.tags ?? []),
        },
      }),
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a transcode job.
   */
  async resolveTranscodeJobConflict(req: mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictRequest): Promise<mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ResolveTranscodeJobConflict", req);
    this.logger.info("resolve_transcode_job_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.RecallBadgeRequest.fromPartial({
      badge: { audit: { updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? "") } },
      context: req?.context,
      details: {
        approver: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
      },
    });
    const invoke1: Unary<communityBadgeApprovalServiceApi.RecallBadgeRequest, communityBadgeApprovalServiceApi.RecallBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.recallBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ResolveTranscodeJobConflict.RecallBadge", () => call<communityBadgeApprovalServiceApi.RecallBadgeRequest, communityBadgeApprovalServiceApi.RecallBadgeResponse>(invoke1, request1));
    const request2 = notificationsNotificationServiceApi.BatchCreateNotificationsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.transcodeJob?.requester,
      } },
    });
    const reply2 = await upload<notificationsNotificationServiceApi.BatchCreateNotificationsRequest, notificationsNotificationServiceApi.BatchCreateNotificationsResponse>(
      (done) => this.notificationsNotificationClient.batchCreateNotifications(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        transcodeJob: { comments: [{ createdAt: reply1?.badge?.audit?.createdAt }] },
      }),
      mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of transcode jobs with a peer.
   */
  async streamTranscodeJobChanges(req: mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesRequest): Promise<mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamTranscodeJobChanges", req);
    this.logger.info("stream_transcode_job_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.ResolveHouseholdsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<customersHouseholdQueryServiceApi.ResolveHouseholdsRequest, customersHouseholdQueryServiceApi.ResolveHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.resolveHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester?.name,
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse>(
      "acme.media.v1.TranscodeJobSyncService/StreamTranscodeJobChanges:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse.fromPartial({
        result: { status: (reply2?.outcome?.status ?? "") },
        transcodeJob: { audit: { createdAt: reply2?.customerSegment?.audit?.createdAt } },
      }),
      mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse.fromPartial({
        transcodeJob: {
          assignee: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.assignee,
          requester: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester,
        },
      }),
    );
  }

  /**
   * Syncs a transcode job.
   */
  async syncTranscodeJobs(req: mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsRequest): Promise<mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "SyncTranscodeJobs", req);
    this.logger.info("sync_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        audit: { updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? "") },
        comments: [{ createdAt: req?.transcodeJob?.audit?.createdAt }],
        requester: { phone: (req?.transcodeJob?.requester?.phone ?? "") },
      },
    });
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest, mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.compareTranscodeJobOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest, mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse>(invoke1, request1));
    const results2 = await Promise.all((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request2 = searchSearchIndexServiceApi.SearchSearchIndexesRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.createdAt,
          ownerId: (item?.commentId ?? ""),
        },
      });
      const invoke2: Unary<searchSearchIndexServiceApi.SearchSearchIndexesRequest, searchSearchIndexServiceApi.SearchSearchIndexesResponse> =
        (input, done) => this.searchSearchIndexClient.searchSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<searchSearchIndexServiceApi.SearchSearchIndexesRequest, searchSearchIndexServiceApi.SearchSearchIndexesResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? searchSearchIndexServiceApi.SearchSearchIndexesResponse.fromPartial({});
    const request3 = mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.transcodeJob?.requester?.email ?? "") } },
      transcodeJob: {
        origin: { $case: "channel", channel: {
          address: ((req?.transcodeJob?.origin?.$case === "channel" ? req?.transcodeJob?.origin.channel : undefined)?.address ?? ""),
          channel: ((req?.transcodeJob?.origin?.$case === "channel" ? req?.transcodeJob?.origin.channel : undefined)?.channel ?? ""),
        } },
      },
    });
    const invoke3: Unary<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.previewTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke4: Unary<licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesRequest, licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesResponse> =
      (input, done) => this.licensingSoftwareLicenseQueryClient.summarizeSoftwareLicenses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          requester: {
            preferredChannel: (reply1?.transcodeJob?.requester?.preferredChannel ?? ""),
          },
        },
      }),
      mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse.fromPartial({ outcome: { effectiveAt: reply3?.outcome?.effectiveAt } }),
      mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          referenceIds: (reply4?.result?.referenceIds ?? []),
        },
      }),
      mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }
}
