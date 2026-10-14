/**
 * Routes media assets through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as ordersOrderServiceApi from "../../../../.cache/proto/acme/orders/v1/order_service.js";
import * as performanceReviewServiceApi from "../../../../.cache/proto/acme/performance/v1/review_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { validateContext } from "../../../platform/context.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetApprovalWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldApprovalService") private readonly formsFormFieldApprovalClient: formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetLifecycleService") private readonly mediaMediaAssetLifecycleClient: mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.orders.v1.OrderService") private readonly ordersOrderClient: ordersOrderServiceApi.OrderServiceClient,
    @inject("grpc:acme.performance.v1.ReviewService") private readonly performanceReviewClient: performanceReviewServiceApi.ReviewServiceClient,
    @inject("grpc:acme.risk.v1.RiskRegisterQueryService") private readonly riskRiskRegisterQueryClient: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a media asset.
   */
  async approveMediaAsset(req: mediaMediaAssetApprovalServiceApi.ApproveMediaAssetRequest): Promise<mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ApproveMediaAsset", req);
    this.logger.info("approve_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = riskRiskRegisterQueryServiceApi.SuggestRiskRegistersRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<riskRiskRegisterQueryServiceApi.SuggestRiskRegistersRequest, riskRiskRegisterQueryServiceApi.SuggestRiskRegistersResponse> =
      (input, done) => this.riskRiskRegisterQueryClient.suggestRiskRegisters(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<riskRiskRegisterQueryServiceApi.SuggestRiskRegistersRequest, riskRiskRegisterQueryServiceApi.SuggestRiskRegistersResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = ordersOrderServiceApi.CreateOrderRequest.fromPartial({
      context: req?.context,
      order: { audit: { etag: (req?.mediaAsset?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<ordersOrderServiceApi.CreateOrderRequest, ordersOrderServiceApi.CreateOrderResponse> =
      (input, done) => this.ordersOrderClient.createOrder(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<ordersOrderServiceApi.CreateOrderRequest, ordersOrderServiceApi.CreateOrderResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_3: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected3_3 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = customersHouseholdValidationServiceApi.PreviewHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { etag: (req?.mediaAsset?.audit?.etag ?? "") },
            location: {
              locality: (selected3_3 ?? ""),
              region: (selected3_1 ?? ""),
            },
          }],
        }],
      },
    });
    const invoke3: Unary<customersHouseholdValidationServiceApi.PreviewHouseholdRequest, customersHouseholdValidationServiceApi.PreviewHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.previewHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdValidationServiceApi.PreviewHouseholdRequest, customersHouseholdValidationServiceApi.PreviewHouseholdResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { createdAt: reply3?.household?.audit?.createdAt } },
      }),
      mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a media asset.
   */
  async commentMediaAssetApproval(req: mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest): Promise<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CommentMediaAssetApproval", req);
    this.logger.info("comment_media_asset_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest.fromPartial({
      context: req?.context,
      mediaAsset: { audit: { updatedAt: req?.mediaAsset?.audit?.updatedAt } },
    });
    const invoke1: Unary<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest, mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse> =
      (input, done) => this.mediaMediaAssetLifecycleClient.scheduleMediaAssetExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply1?.mediaAsset?.audit?.updatedAt } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a media asset.
   */
  async delegateMediaAssetApproval(req: mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest): Promise<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "DelegateMediaAssetApproval", req);
    this.logger.info("delegate_media_asset_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.mediaAsset?.owner?.userId ?? ""),
        region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>(
      "acme.media.v1.MediaAssetApprovalService/DelegateMediaAssetApproval:0", request1,
    );
    let selected2_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = customersHouseholdQueryServiceApi.CountHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected2_1 ?? "") },
    });
    const invoke2: Unary<customersHouseholdQueryServiceApi.CountHouseholdsRequest, customersHouseholdQueryServiceApi.CountHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.countHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdQueryServiceApi.CountHouseholdsRequest, customersHouseholdQueryServiceApi.CountHouseholdsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          owner: req?.mediaAsset?.owner,
        },
      }),
    );
  }

  /**
   * Escalates a media asset.
   */
  async escalateMediaAsset(req: mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest): Promise<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "EscalateMediaAsset", req);
    this.logger.info("escalate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.PreviewSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: {
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        } },
        owner: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.PreviewSearchIndexRequest, searchSearchIndexValidationServiceApi.PreviewSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.previewSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<searchSearchIndexValidationServiceApi.PreviewSearchIndexResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse.fromPartial({
        mediaAsset: { owner: { email: (reply1?.searchIndex?.owner?.email ?? "") } },
      }),
      mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists media assets a page at a time.
   */
  async listPendingMediaAssets(req: mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsRequest): Promise<mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingMediaAssets", req);
    this.logger.info("list_pending_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.CreateMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
      },
    });
    const invoke1: Unary<metricsMetricSeriesServiceApi.CreateMetricSeriesRequest, metricsMetricSeriesServiceApi.CreateMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesClient.createMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.metricSeries?.owner?.displayName ?? "") },
      },
      formField: {
        audit: { createdAt: reply1?.metricSeries?.audit?.createdAt },
        owner: {
          email: (reply1?.metricSeries?.owner?.email ?? ""),
          userId: (reply1?.metricSeries?.owner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse> =
      (input, done) => this.formsFormFieldApprovalClient.delegateFormFieldApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsResponse.fromPartial({
        mediaAssets: [{
          dimensions: { height: (reply1?.metricSeries?.dimensions?.height ?? 0) },
        }],
      }),
      mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsResponse.fromPartial({
        mediaAssets: [{
          name: (reply2?.formField?.name ?? ""),
          owner: { userId: (reply2?.formField?.owner?.userId ?? "") },
        }],
      }),
    );
  }

  /**
   * Rejects a media asset.
   */
  async rejectMediaAsset(req: mediaMediaAssetApprovalServiceApi.RejectMediaAssetRequest): Promise<mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "RejectMediaAsset", req);
    this.logger.info("reject_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const method1 = "compareConsentRecordOptions" as const;
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(invoke1, request1);
    const request2 = mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          lines: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.lines ?? []).map((value) => value),
        } },
        dimensions: { weight: (req?.mediaAsset?.dimensions?.weight ?? 0) },
      },
    });
    const proxy2 = forwarding(this.mediaRenditionSyncClient);
    const invoke2: Unary<mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest, mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse> =
      (input, done) => proxy2.resolveRenditionConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest, mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          specs: (req?.mediaAsset?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Submits a media asset.
   */
  async submitMediaAsset(req: mediaMediaAssetApprovalServiceApi.SubmitMediaAssetRequest): Promise<mediaMediaAssetApprovalServiceApi.SubmitMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "SubmitMediaAsset", req);
    this.logger.info("submit_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = performanceReviewServiceApi.UpdateReviewRequest.fromPartial({
      context: req?.context,
      review: {
        audit: {
          createdAt: req?.mediaAsset?.audit?.createdAt,
          updatedAt: req?.mediaAsset?.audit?.updatedAt,
        },
      },
    });
    const invoke1: Unary<performanceReviewServiceApi.UpdateReviewRequest, performanceReviewServiceApi.UpdateReviewResponse> =
      (input, done) => this.performanceReviewClient.updateReview(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<performanceReviewServiceApi.UpdateReviewRequest, performanceReviewServiceApi.UpdateReviewResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetApprovalServiceApi.SubmitMediaAssetResponse.fromPartial({
        mediaAsset: {
          owner: { displayName: (reply1?.review?.counterparty?.displayName ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetApprovalServiceApi.SubmitMediaAssetResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for MediaAssetApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetApprovalHandler {
  constructor(@inject(MediaAssetApprovalWorkflow) private readonly workflow: MediaAssetApprovalWorkflow) {}

  /**
   * Approves a media asset.
   */
  approveMediaAsset = unary<mediaMediaAssetApprovalServiceApi.ApproveMediaAssetRequest, mediaMediaAssetApprovalServiceApi.ApproveMediaAssetResponse>(
    (request) => this.workflow.approveMediaAsset(request),
  );

  /**
   * Comments a media asset.
   */
  commentMediaAssetApproval = unary<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse>(
    (request) => this.workflow.commentMediaAssetApproval(request),
  );

  /**
   * Delegates a media asset.
   */
  delegateMediaAssetApproval = (call: ServerUnaryCall<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse>, done: sendUnaryData<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse>): void => {
    void this.workflow.delegateMediaAssetApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a media asset.
   */
  escalateMediaAsset = unary<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse>(
    (request) => this.workflow.escalateMediaAsset(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  listPendingMediaAssets = unary<mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsRequest, mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsResponse>(
    (request) => this.workflow.listPendingMediaAssets(request),
  );

  /**
   * Rejects a media asset.
   */
  rejectMediaAsset = (call: ServerUnaryCall<mediaMediaAssetApprovalServiceApi.RejectMediaAssetRequest, mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetApprovalServiceApi.RejectMediaAssetResponse>): void => {
    void this.workflow.rejectMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a media asset.
   */
  submitMediaAsset = unary<mediaMediaAssetApprovalServiceApi.SubmitMediaAssetRequest, mediaMediaAssetApprovalServiceApi.SubmitMediaAssetResponse>(
    (request) => this.workflow.submitMediaAsset(request),
  );
}

export function implementation(handler: MediaAssetApprovalHandler): mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceServer {
  return {
    approveMediaAsset: handler.approveMediaAsset,
    commentMediaAssetApproval: handler.commentMediaAssetApproval,
    delegateMediaAssetApproval: handler.delegateMediaAssetApproval,
    escalateMediaAsset: handler.escalateMediaAsset,
    listPendingMediaAssets: handler.listPendingMediaAssets,
    rejectMediaAsset: handler.rejectMediaAsset,
    submitMediaAsset: handler.submitMediaAsset,
  };
}
