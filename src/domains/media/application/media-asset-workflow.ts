/**
 * Runs the long-lived workflow that takes a media asset from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaMediaAssetWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as mediaRenditionLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as pipelinesPipelineQueryServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetWorkflowWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetApprovalService") private readonly mediaMediaAssetApprovalClient: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionApprovalService") private readonly mediaRenditionApprovalClient: mediaRenditionApprovalServiceApi.RenditionApprovalServiceClient,
    @inject("grpc:acme.media.v1.RenditionLifecycleService") private readonly mediaRenditionLifecycleClient: mediaRenditionLifecycleServiceApi.RenditionLifecycleServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineQueryService") private readonly pipelinesPipelineQueryClient: pipelinesPipelineQueryServiceApi.PipelineQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionWorkflowService") private readonly surveysQuestionWorkflowClient: surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a media asset.
   */
  async advanceMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "AdvanceMediaAssetWorkflow", req);
    this.logger.info("advance_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = documentsDocumentQueryServiceApi.BrowseDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        ownerId: (req?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<documentsDocumentQueryServiceApi.BrowseDocumentsRequest, documentsDocumentQueryServiceApi.BrowseDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.browseDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentQueryServiceApi.BrowseDocumentsRequest, documentsDocumentQueryServiceApi.BrowseDocumentsResponse>(invoke1, request1);
    const request2 = mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          postalCode: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.postalCode ?? ""),
        } },
        components: { primary: {
          description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        } },
        dimensions: {
          length: (req?.mediaAsset?.dimensions?.length ?? 0),
          weight: (req?.mediaAsset?.dimensions?.weight ?? 0),
        },
      },
    });
    const invoke2: Unary<mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryRequest, mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse> =
      (input, done) => this.mediaRenditionLifecycleClient.scheduleRenditionExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          specs: (req?.mediaAsset?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Cancels a media asset.
   */
  async cancelMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CancelMediaAssetWorkflow", req);
    this.logger.info("cancel_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest.fromPartial({
      context: req?.context,
      webhookDelivery: { subject: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest, webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse>(
      "acme.media.v1.MediaAssetWorkflowService/CancelMediaAssetWorkflow:0", request1,
    );
    const request2 = customersCustomerServiceApi.WatchCustomersRequest.fromPartial({
      context: req?.context,
      subscriber: {
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.customersCustomerClient.watchCustomers(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? customersCustomerServiceApi.WatchCustomersResponse.fromPartial({});
    const request3 = customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          createdAt: req?.mediaAsset?.audit?.createdAt,
          createdBy: (req?.mediaAsset?.audit?.createdBy ?? ""),
          updatedBy: (req?.mediaAsset?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.previewCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentResponse>(invoke3, request3));
    const request4 = surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      question: {
        audit: { etag: (reply3?.customerSegment?.audit?.etag ?? "") },
        owner: { userId: (req?.mediaAsset?.owner?.userId ?? "") },
      },
    });
    const invoke4: Unary<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse> =
      (input, done) => this.surveysQuestionWorkflowClient.advanceQuestionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          audit: { updatedBy: (reply3?.customerSegment?.audit?.updatedBy ?? "") },
          components: { primary: { description: (reply3?.customerSegment?.description ?? "") } },
        },
      }),
      mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: { audit: { updatedBy: (reply4?.question?.audit?.updatedBy ?? "") } },
        result: { status: (reply4?.outcome?.status ?? "") },
      }),
      mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a media asset.
   */
  async inspectMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectMediaAssetWorkflow", req);
    this.logger.info("inspect_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.ListAffinityReportsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.mediaAssetId ?? "") },
    });
    const invoke1: Unary<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse> =
      (input, done) => this.personalizationAffinityReportingClient.listAffinityReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } }),
    );
  }

  /**
   * Lists media assets a page at a time.
   */
  async listMediaAssetWorkflows(req: mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsRequest): Promise<mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMediaAssetWorkflows", req);
    this.logger.info("list_media_asset_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a media asset.
   */
  async pauseMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "PauseMediaAssetWorkflow", req);
    this.logger.info("pause_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_3 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = customersCustomerServiceApi.CreateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: { updatedBy: (req?.mediaAsset?.audit?.updatedBy ?? "") },
        contact: {
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
        primaryAddress: { recipient: (selected1_3 ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerServiceApi.CreateCustomerRequest, customersCustomerServiceApi.CreateCustomerResponse> =
      (input, done) => this.customersCustomerClient.createCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerServiceApi.CreateCustomerRequest, customersCustomerServiceApi.CreateCustomerResponse>(invoke1, request1);
    const request2 = mediaTranscodeJobSyncServiceApi.PullTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { email: (reply1?.customer?.relationshipManager?.email ?? "") },
        requester: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const method2 = "pullTranscodeJobs" as const;
    const invoke2: Unary<mediaTranscodeJobSyncServiceApi.PullTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobSyncServiceApi.PullTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse>(invoke2, request2);
    const request3 = mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          locality: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
        } },
        audit: { createdBy: (reply1?.customer?.audit?.createdBy ?? "") },
      },
    });
    const proxy3 = forwarding(this.mediaMediaAssetSyncClient);
    const invoke3: Unary<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse> =
      (input, done) => proxy3.syncMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          owner: { userId: (reply1?.customer?.relationshipManager?.userId ?? "") },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply3?.mediaAsset?.audit?.updatedAt } },
      }),
      mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a media asset.
   */
  async resumeMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ResumeMediaAssetWorkflow", req);
    this.logger.info("resume_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: Array<string> | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected1_2 = [];
    }
    const request1 = customersCustomerCalculationServiceApi.EstimateCustomerRequest.fromPartial({
      context: req?.context,
      customer: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
      details: { destination: { lines: (selected1_2 ?? []) } },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.estimateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply1?.customer?.audit?.updatedAt } },
      }),
      mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a media asset.
   */
  async retryMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "RetryMediaAssetWorkflow", req);
    this.logger.info("retry_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionApprovalServiceApi.EscalateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { owner: { email: (req?.mediaAsset?.owner?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<mediaRenditionApprovalServiceApi.EscalateRenditionRequest, mediaRenditionApprovalServiceApi.EscalateRenditionResponse> =
      (input, done) => this.mediaRenditionApprovalClient.escalateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionApprovalServiceApi.EscalateRenditionRequest, mediaRenditionApprovalServiceApi.EscalateRenditionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest.fromPartial({
      context: input2?.context,
      mediaAsset: {
        dimensions: { width: (input2?.mediaAsset?.dimensions?.width ?? 0) },
        owner: { email: (input2?.details?.notify?.email ?? "") },
      },
    });
    const invoke2: Unary<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.commentMediaAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a media asset.
   */
  async signalMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "SignalMediaAssetWorkflow", req);
    this.logger.info("signal_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = pipelinesPipelineQueryServiceApi.FindPipelinesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.createdAt,
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<pipelinesPipelineQueryServiceApi.FindPipelinesRequest, pipelinesPipelineQueryServiceApi.FindPipelinesResponse> =
      (input, done) => this.pipelinesPipelineQueryClient.findPipelines(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<pipelinesPipelineQueryServiceApi.FindPipelinesRequest, pipelinesPipelineQueryServiceApi.FindPipelinesResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        measurements: [{ unit: (req?.mediaAsset?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") },
      },
    });
    const decoded2 = notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.resolveDeliveryAttemptConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse>(invoke2, decoded2);
    const request3 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      consentRecord: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        kind: (reply2?.deliveryAttempt?.kind ?? ""),
        subject: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.PreviewConsentRecordRequest",
      value: Buffer.from(customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.encode(request3).finish()),
    });
    const unpacked3 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.decode(envelope3.value);
    const invoke3: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse>(invoke3, unpacked3);
    let selected4_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected4_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { recipient: (selected4_1 ?? "") } },
      },
    });
    const invoke4: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: { owner: { email: (reply4?.searchIndex?.owner?.email ?? "") } },
        outcome: { message: (reply4?.result?.message ?? "") },
      }),
      mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a media asset.
   */
  async startMediaAssetWorkflow(req: mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowRequest): Promise<mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "StartMediaAssetWorkflow", req);
    this.logger.info("start_media_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.BatchGetUsersRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> =
      (input, done) => this.identityUserClient.batchGetUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest.fromPartial({
      consentRecord: { measurements: [{ unit: (req?.mediaAsset?.dimensions?.unit ?? "") }] },
      context: req?.context,
      details: {
        destination: {
          locality: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
        },
      },
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.estimateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (req?.mediaAsset?.owner?.userId ?? ""),
        region: (selected3_1 ?? ""),
      },
    });
    const invoke3: Unary<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse> =
      (input, done) => this.personalizationAffinitySyncClient.listAffinityConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          specs: (req?.mediaAsset?.specs ?? {}),
        },
      }),
    );
  }
}
