/**
 * Routes renditions through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as licensingSoftwareLicenseServiceApi from "../../../../.cache/proto/acme/licensing/v1/software_license_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
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
} from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRenditionRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionApprovalWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.licensing.v1.SoftwareLicenseService") private readonly licensingSoftwareLicenseClient: licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetLifecycleService") private readonly mediaMediaAssetLifecycleClient: mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionReportingService") private readonly mediaRenditionReportingClient: mediaRenditionReportingServiceApi.RenditionReportingServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobReportingService") private readonly mediaTranscodeJobReportingClient: mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionApprovalService") private readonly surveysQuestionApprovalClient: surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a rendition.
   */
  async approveRendition(req: mediaRenditionApprovalServiceApi.ApproveRenditionRequest): Promise<mediaRenditionApprovalServiceApi.ApproveRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ApproveRendition", req);
    this.logger.info("approve_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionSyncServiceApi.SyncRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: { dimensions: { height: (req?.rendition?.dimensions?.height ?? 0) } },
    });
    const invoke1: Unary<mediaRenditionSyncServiceApi.SyncRenditionsRequest, mediaRenditionSyncServiceApi.SyncRenditionsResponse> =
      (input, done) => this.mediaRenditionSyncClient.syncRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = venuesVenueValidationServiceApi.PreviewVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        audit: { updatedBy: (reply1?.rendition?.audit?.updatedBy ?? "") },
        dimensions: { width: (req?.rendition?.dimensions?.width ?? 0) },
      },
    });
    const reply2 = await this.workQueue.enqueue<venuesVenueValidationServiceApi.PreviewVenueRequest, venuesVenueValidationServiceApi.PreviewVenueResponse>(
      "acme.media.v1.RenditionApprovalService/ApproveRendition:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.ApproveRenditionResponse.fromPartial({ rendition: { specs: (reply1?.rendition?.specs ?? {}) } }),
      mediaRenditionApprovalServiceApi.ApproveRenditionResponse.fromPartial({
        rendition: {
          categoryPath: (reply2?.venue?.categoryPath ?? []),
          code: (reply2?.venue?.code ?? ""),
        },
      }),
      mediaRenditionApprovalServiceApi.ApproveRenditionResponse.fromPartial({
        rendition: {
          name: (req?.rendition?.name ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a rendition.
   */
  async commentRenditionApproval(req: mediaRenditionApprovalServiceApi.CommentRenditionApprovalRequest): Promise<mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "CommentRenditionApproval", req);
    this.logger.info("comment_rendition_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionApprovalServiceApi.RecallQuestionRequest.fromPartial({
      context: req?.context,
      question: { audit: { updatedBy: (req?.rendition?.audit?.updatedBy ?? "") } },
    });
    const invoke1: Unary<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse> =
      (input, done) => this.surveysQuestionApprovalClient.recallQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse>(invoke1, request1));
    const request2 = mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse> =
      (input, done) => this.mediaTranscodeJobReportingClient.scheduleTranscodeJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: { owner: { userId: (reply1?.question?.owner?.userId ?? "") } },
    });
    const invoke3: Unary<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest, mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.reconcileMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    let selected4_1: string | undefined;
    switch (reply3?.mediaAsset?.locator?.$case) {
      case "address":
        selected4_1 = ((reply3?.mediaAsset?.locator?.$case === "address" ? reply3?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.question?.audit?.createdAt,
        region: (selected4_1 ?? ""),
      },
    });
    const invoke4: Unary<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest, mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.listMediaAssetConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest, mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse>(invoke4, request4);
    const request5 = chatHandoffSyncServiceApi.StreamHandoffChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: req?.details?.approver,
        requester: { email: (req?.context?.actor?.email ?? "") },
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream5 = this.chatHandoffSyncClient.streamHandoffChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.comment ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse.fromPartial({
        rendition: { audit: { createdBy: (reply1?.question?.audit?.createdBy ?? "") } },
      }),
      mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Delegates a rendition.
   */
  async delegateRenditionApproval(req: mediaRenditionApprovalServiceApi.DelegateRenditionApprovalRequest): Promise<mediaRenditionApprovalServiceApi.DelegateRenditionApprovalResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "DelegateRenditionApproval", req);
    this.logger.info("delegate_rendition_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostWorkflowServiceApi.ListPostWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.rendition?.specs ?? {}))),
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const method1 = "listPostWorkflows" as const;
    const invoke1: Unary<communityPostWorkflowServiceApi.ListPostWorkflowsRequest, communityPostWorkflowServiceApi.ListPostWorkflowsResponse> =
      (input, done) => this.communityPostWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostWorkflowServiceApi.ListPostWorkflowsRequest, communityPostWorkflowServiceApi.ListPostWorkflowsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.DelegateRenditionApprovalResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaRenditionApprovalServiceApi.DelegateRenditionApprovalResponse.fromPartial({
        rendition: {
          name: (req?.rendition?.name ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a rendition.
   */
  async escalateRendition(req: mediaRenditionApprovalServiceApi.EscalateRenditionRequest): Promise<mediaRenditionApprovalServiceApi.EscalateRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "EscalateRendition", req);
    this.logger.info("escalate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
      transcodeJob: {
        assignee: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.rendition?.owner?.userId ?? ""),
        },
        origin: { $case: "customer", customer: { email: (req?.details?.approver?.email ?? "") } },
      },
    });
    const proxy1 = forwarding(this.mediaTranscodeJobCalculationClient);
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse> =
      (input, done) => proxy1.quoteTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.transcodeJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.rendition?.renditionId ?? ""),
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse>(invoke2, request2);
    const request3 = mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          locality: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.locality ?? ""),
        } },
        audit: { etag: (req?.rendition?.audit?.etag ?? "") },
        components: { primary: { quantity: (req?.rendition?.components?.["primary"]?.quantity ?? 0) } },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest, mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.reconcileMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest, mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.EscalateRenditionResponse.fromPartial({
        rendition: {
          owner: { userId: (reply1?.transcodeJob?.assignee?.userId ?? "") },
          tags: (reply1?.transcodeJob?.tags ?? []),
        },
      }),
      mediaRenditionApprovalServiceApi.EscalateRenditionResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      mediaRenditionApprovalServiceApi.EscalateRenditionResponse.fromPartial({ rendition: { categoryPath: (reply3?.mediaAsset?.categoryPath ?? []) } }),
      mediaRenditionApprovalServiceApi.EscalateRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async getRenditionApprovalStatus(req: mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusRequest): Promise<mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRenditionApprovalStatus", req);
    this.logger.info("get_rendition_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = customersCustomerQueryServiceApi.BrowseCustomersRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.context?.deadline,
        labels: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
        ownerId: (input1?.renditionId ?? ""),
      },
    });
    const invoke1: Unary<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.browseCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse>(invoke1, request1);
    return mergeResponses(
      mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Lists renditions a page at a time.
   */
  async listPendingRenditions(req: mediaRenditionApprovalServiceApi.ListPendingRenditionsRequest): Promise<mediaRenditionApprovalServiceApi.ListPendingRenditionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingRenditions", req);
    this.logger.info("list_pending_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const cloned1: mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest, mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse> =
      (input, done) => this.mediaMediaAssetLifecycleClient.scheduleMediaAssetExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest, mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse>(invoke1, cloned1);
    const request2 = audiencesAudienceServiceApi.BatchCreateAudiencesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply2 = await upload<audiencesAudienceServiceApi.BatchCreateAudiencesRequest, audiencesAudienceServiceApi.BatchCreateAudiencesResponse>(
      (done) => this.audiencesAudienceClient.batchCreateAudiences(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionApprovalServiceApi.ListPendingRenditionsResponse.fromPartial({
      renditions: [{
        components: { primary: {
          quantity: (reply1?.mediaAsset?.components?.["primary"]?.quantity ?? 0),
        } },
        dimensions: { length: (reply1?.mediaAsset?.dimensions?.length ?? 0) },
      }],
    });
  }

  /**
   * Recalls a rendition.
   */
  async recallRendition(req: mediaRenditionApprovalServiceApi.RecallRenditionRequest): Promise<mediaRenditionApprovalServiceApi.RecallRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "RecallRendition", req);
    this.logger.info("recall_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.createdAt,
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const decoded1 = licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest.fromJSON(
      JSON.parse(JSON.stringify(licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest.toJSON(request1))),
    );
    const invoke1: Unary<licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest, licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesResponse> =
      (input, done) => this.licensingSoftwareLicenseClient.searchSoftwareLicenses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest, licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesResponse>(invoke1, decoded1);
    const request2 = mediaRenditionReportingServiceApi.ShareRenditionReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.details?.approver?.email ?? "") } },
      reason: (req?.reason ?? ""),
      renditionId: (req?.rendition?.renditionId ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.ShareRenditionReportRequest",
      value: Buffer.from(mediaRenditionReportingServiceApi.ShareRenditionReportRequest.encode(request2).finish()),
    });
    const unpacked2 = mediaRenditionReportingServiceApi.ShareRenditionReportRequest.decode(envelope2.value);
    const invoke2: Unary<mediaRenditionReportingServiceApi.ShareRenditionReportRequest, mediaRenditionReportingServiceApi.ShareRenditionReportResponse> =
      (input, done) => this.mediaRenditionReportingClient.shareRenditionReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionReportingServiceApi.ShareRenditionReportRequest, mediaRenditionReportingServiceApi.ShareRenditionReportResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.RecallRenditionResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionApprovalServiceApi.RecallRenditionResponse.fromPartial({
        rendition: {
          audit: { updatedAt: reply2?.rendition?.audit?.updatedAt },
          specs: (reply2?.rendition?.specs ?? {}),
        },
      }),
      mediaRenditionApprovalServiceApi.RecallRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a rendition.
   */
  async rejectRendition(req: mediaRenditionApprovalServiceApi.RejectRenditionRequest): Promise<mediaRenditionApprovalServiceApi.RejectRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "RejectRendition", req);
    this.logger.info("reject_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationExportServiceApi.StreamNotificationExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.updatedAt,
        ownerId: (req?.rendition?.owner?.userId ?? ""),
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationExportClient.streamNotificationExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationExportServiceApi.StreamNotificationExportResponse.fromPartial({});
    const request2 = customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const client2 = this.clients.get<customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient>("acme.customers.v1.ConsentRecordValidationService");
    const invoke2: Unary<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse> =
      (input, done) => client2.explainConsentRecordDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse>(invoke2, request2);
    const request3 = surveysQuestionApprovalServiceApi.SubmitQuestionRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.rendition?.owner?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      question: {
        audit: {
          updatedAt: req?.rendition?.audit?.updatedAt,
          updatedBy: (req?.rendition?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<surveysQuestionApprovalServiceApi.SubmitQuestionRequest, surveysQuestionApprovalServiceApi.SubmitQuestionResponse> =
      (input, done) => this.surveysQuestionApprovalClient.submitQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<surveysQuestionApprovalServiceApi.SubmitQuestionRequest, surveysQuestionApprovalServiceApi.SubmitQuestionResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.RejectRenditionResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      mediaRenditionApprovalServiceApi.RejectRenditionResponse.fromPartial({
        rendition: { audit: { updatedAt: reply3?.question?.audit?.updatedAt } },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      mediaRenditionApprovalServiceApi.RejectRenditionResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Submits a rendition.
   */
  async submitRendition(req: mediaRenditionApprovalServiceApi.SubmitRenditionRequest): Promise<mediaRenditionApprovalServiceApi.SubmitRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "SubmitRendition", req);
    this.logger.info("submit_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.NormalizeVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: {
          region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
        } },
      },
    });
    const invoke1: Unary<venuesVenueValidationServiceApi.NormalizeVenueRequest, venuesVenueValidationServiceApi.NormalizeVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.normalizeVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<venuesVenueValidationServiceApi.NormalizeVenueRequest, venuesVenueValidationServiceApi.NormalizeVenueResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionApprovalServiceApi.SubmitRenditionResponse.fromPartial({
        rendition: { owner: { userId: (reply1?.venue?.owner?.userId ?? "") } },
      }),
      mediaRenditionApprovalServiceApi.SubmitRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for RenditionApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionApprovalHandler {
  constructor(@inject(RenditionApprovalWorkflow) private readonly workflow: RenditionApprovalWorkflow) {}

  /**
   * Approves a rendition.
   */
  approveRendition = unary<mediaRenditionApprovalServiceApi.ApproveRenditionRequest, mediaRenditionApprovalServiceApi.ApproveRenditionResponse>(
    (request) => this.workflow.approveRendition(request),
  );

  /**
   * Comments a rendition.
   */
  commentRenditionApproval = unary<mediaRenditionApprovalServiceApi.CommentRenditionApprovalRequest, mediaRenditionApprovalServiceApi.CommentRenditionApprovalResponse>(
    (request) => this.workflow.commentRenditionApproval(request),
  );

  /**
   * Delegates a rendition.
   */
  delegateRenditionApproval = (call: ServerUnaryCall<mediaRenditionApprovalServiceApi.DelegateRenditionApprovalRequest, mediaRenditionApprovalServiceApi.DelegateRenditionApprovalResponse>, done: sendUnaryData<mediaRenditionApprovalServiceApi.DelegateRenditionApprovalResponse>): void => {
    void this.workflow.delegateRenditionApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a rendition.
   */
  escalateRendition = unary<mediaRenditionApprovalServiceApi.EscalateRenditionRequest, mediaRenditionApprovalServiceApi.EscalateRenditionResponse>(
    (request) => this.workflow.escalateRendition(request),
  );

  /**
   * Returns a rendition.
   */
  getRenditionApprovalStatus = unary<mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusRequest, mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusResponse>(
    (request) => this.workflow.getRenditionApprovalStatus(request),
  );

  /**
   * Lists renditions a page at a time.
   */
  listPendingRenditions = (call: ServerUnaryCall<mediaRenditionApprovalServiceApi.ListPendingRenditionsRequest, mediaRenditionApprovalServiceApi.ListPendingRenditionsResponse>, done: sendUnaryData<mediaRenditionApprovalServiceApi.ListPendingRenditionsResponse>): void => {
    void this.workflow.listPendingRenditions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a rendition.
   */
  recallRendition = unary<mediaRenditionApprovalServiceApi.RecallRenditionRequest, mediaRenditionApprovalServiceApi.RecallRenditionResponse>(
    (request) => this.workflow.recallRendition(request),
  );

  /**
   * Rejects a rendition.
   */
  rejectRendition = unary<mediaRenditionApprovalServiceApi.RejectRenditionRequest, mediaRenditionApprovalServiceApi.RejectRenditionResponse>(
    (request) => this.workflow.rejectRendition(request),
  );

  /**
   * Submits a rendition.
   */
  submitRendition = (call: ServerUnaryCall<mediaRenditionApprovalServiceApi.SubmitRenditionRequest, mediaRenditionApprovalServiceApi.SubmitRenditionResponse>, done: sendUnaryData<mediaRenditionApprovalServiceApi.SubmitRenditionResponse>): void => {
    void this.workflow.submitRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: RenditionApprovalHandler): mediaRenditionApprovalServiceApi.RenditionApprovalServiceServer {
  return {
    approveRendition: handler.approveRendition,
    commentRenditionApproval: handler.commentRenditionApproval,
    delegateRenditionApproval: handler.delegateRenditionApproval,
    escalateRendition: handler.escalateRendition,
    getRenditionApprovalStatus: handler.getRenditionApprovalStatus,
    listPendingRenditions: handler.listPendingRenditions,
    recallRendition: handler.recallRendition,
    rejectRendition: handler.rejectRendition,
    submitRendition: handler.submitRendition,
  };
}
