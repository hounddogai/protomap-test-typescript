/**
 * Moves a transcode job between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as mediaTranscodeJobLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
import { toTranscodeJobRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobLifecycleWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobWorkflowService") private readonly localizationTranslationJobWorkflowClient: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobReportingService") private readonly mediaTranscodeJobReportingClient: mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a transcode job.
   */
  async activateTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateTranscodeJob", req);
    this.logger.info("activate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.notifyContact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.explainNotificationTemplateCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse>(invoke1, request1));
    const request2 = customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { updatedAt: reply1?.notificationTemplate?.audit?.updatedAt },
        owner: { email: (req?.details?.notifyContact?.email ?? "") },
      },
      details: {
        destination: {
          lines: (reply1?.notificationTemplate?.billingAddress?.lines ?? []).map((value) => value),
          recipient: (reply1?.notificationTemplate?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.compareCustomerSegmentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ActivateTranscodeJob.CompareCustomerSegmentOptions", () => call<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse.fromPartial({
        transcodeJob: { requester: { email: (reply2?.customerSegment?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Expires a transcode job.
   */
  async expireTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireTranscodeJob", req);
    this.logger.info("expire_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.newOwner?.email ?? "") } },
      searchIndex: { owner: { userId: (req?.details?.newOwner?.userId ?? "") } },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest, searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionResponse> =
      (input, done) => this.searchSearchIndexValidationClient.explainSearchIndexDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        components: { primary: {
          componentId: (reply1?.searchIndex?.components?.["primary"]?.componentId ?? ""),
        } },
      },
    });
    const reply2 = await this.workQueue.enqueue<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>(
      "acme.media.v1.TranscodeJobLifecycleService/ExpireTranscodeJob:1", request2,
    );
    const request3 = mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest.fromPartial({
      context: req?.context,
      transcodeJobId: (req?.transcodeJobId ?? ""),
    });
    const invoke3: Unary<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.getTranscodeJobRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse.fromPartial({
        result: { message: (reply1?.outcome?.message ?? "") },
        transcodeJob: { assignee: { email: (reply1?.searchIndex?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse.fromPartial({
        transcodeJob: { audit: { updatedAt: reply2?.mediaAsset?.audit?.updatedAt } },
      }),
      mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse.fromPartial({ transcodeJob: { status: reply3?.transcodeJob?.status } }),
      mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async getTranscodeJobLifecycle(req: mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleRequest): Promise<mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobLifecycle", req);
    this.logger.info("get_transcode_job_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionQueryServiceApi.SuggestRenditionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.transcodeJobId ?? ""),
      },
    });
    const invoke1: Unary<mediaRenditionQueryServiceApi.SuggestRenditionsRequest, mediaRenditionQueryServiceApi.SuggestRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.suggestRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<mediaRenditionQueryServiceApi.SuggestRenditionsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        components: { primary: { componentId: (reply1?.result?.correlationId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.calculateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleResponse.fromPartial({
        transcodeJob: { assignee: { userId: (reply2?.mediaAsset?.owner?.userId ?? "") } },
      }),
      mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Reinstates a transcode job.
   */
  async reinstateTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateTranscodeJob", req);
    this.logger.info("reinstate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.ExportCustomersRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const stream1 = this.customersCustomerQueryClient.exportCustomers(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? customersCustomerQueryServiceApi.ExportCustomersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
    });
  }

  /**
   * Renews a transcode job.
   */
  async renewTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewTranscodeJob", req);
    this.logger.info("renew_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetServiceApi.WatchMediaAssetsRequest.fromPartial({
      context: req?.context,
      subscriber: { name: req?.details?.notifyContact?.name },
    });
    const stream1 = this.mediaMediaAssetClient.watchMediaAssets(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({});
    const request2 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      mediaAsset: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const method3 = "batchGetNotifications" as const;
    const invoke3: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(invoke3, request3);
    const request4 = localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.details?.newOwner?.userId ?? "") },
        origin: { $case: "customer", customer: { email: (req?.details?.notifyContact?.email ?? "") } },
      },
    });
    const proxy4 = forwarding(this.localizationTranslationJobWorkflowClient);
    const invoke4: Unary<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> =
      (input, done) => proxy4.advanceTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse.fromPartial({
        transcodeJob: { requester: { email: (reply2?.mediaAsset?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse.fromPartial({ outcome: { message: (reply4?.result?.message ?? "") } }),
      mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Schedules a transcode job.
   */
  async scheduleTranscodeJobExpiry(req: mediaTranscodeJobLifecycleServiceApi.ScheduleTranscodeJobExpiryRequest): Promise<mediaTranscodeJobLifecycleServiceApi.ScheduleTranscodeJobExpiryResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ScheduleTranscodeJobExpiry", req);
    this.logger.info("schedule_transcode_job_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request1 = mediaMediaAssetServiceApi.WatchMediaAssetsRequest.fromPartial({
        context: req?.context,
        since: item?.changedAt,
        subscriber: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          preferredChannel: (req?.transcodeJob?.requester?.preferredChannel ?? ""),
        },
      });
      const stream1 = this.mediaMediaAssetClient.watchMediaAssets(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
      const messages1 = await collect(stream1);
      const reply1 = messages1.at(-1) ?? mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({});
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({});
    const results2 = await Promise.all((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request2 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.createdAt,
          labels: Object.fromEntries(Object.entries((req?.transcodeJob?.customFields ?? {}))),
          ownerId: (item?.commentId ?? ""),
        },
      });
      const invoke2: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
        (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? customersHouseholdQueryServiceApi.FindHouseholdsResponse.fromPartial({});
    const settled3 = await Promise.allSettled((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request3 = chatHandoffSyncServiceApi.SyncHandoffsRequest.fromPartial({
        context: req?.context,
        handoff: {
          history: [{
            fromStatus: (item?.fromStatus ?? ""),
            toStatus: (item?.toStatus ?? ""),
          }],
        },
      });
      const invoke3: Unary<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse> =
        (input, done) => this.chatHandoffSyncClient.syncHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: chatHandoffSyncServiceApi.SyncHandoffsResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? chatHandoffSyncServiceApi.SyncHandoffsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mediaTranscodeJobLifecycleServiceApi.ScheduleTranscodeJobExpiryResponse.fromPartial({
      transcodeJob: {
        requester: req?.transcodeJob?.requester,
        transcodeJobId: (req?.transcodeJobId ?? ""),
      },
    });
  }

  /**
   * Suspends a transcode job.
   */
  async suspendTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendTranscodeJob", req);
    this.logger.info("suspend_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.transcodeJobId ?? ""),
      },
    });
    const invoke1: Unary<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse> =
      (input, done) => this.mediaTranscodeJobReportingClient.listTranscodeJobReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse>(invoke1, request1);
    const request2 = searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.suggestSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusRequest.fromPartial({
      context: input3?.context,
      transcodeJobId: (input3?.transcodeJobId ?? ""),
    });
    const invoke3: Unary<mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusRequest, mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse> =
      (input, done) => this.mediaTranscodeJobImportClient.getTranscodeJobImportStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusRequest, mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse.fromPartial({ transcodeJob: { status: reply3?.transcodeJob?.status } }),
      mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Terminates a transcode job.
   */
  async terminateTranscodeJob(req: mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobRequest): Promise<mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateTranscodeJob", req);
    this.logger.info("terminate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CreateUserRequest.fromPartial({
      context: req?.context,
      user: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
        relationshipManager: { email: (req?.details?.newOwner?.email ?? "") },
      },
    });
    const cloned1: identityUserServiceApi.CreateUserRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse> =
      (input, done) => this.identityUserClient.createUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse>(invoke1, cloned1);
    const request2 = mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.user?.audit?.createdAt,
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const decoded2 = mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest.toJSON(request2))),
    );
    const invoke2: Unary<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse> =
      (input, done) => this.mediaTranscodeJobSyncClient.listTranscodeJobConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }
}
