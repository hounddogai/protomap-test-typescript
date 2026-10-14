/**
 * Answers read-only questions about media assets, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetQueryServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_query_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as telematicsTelemetryReadingServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetQueryWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingService") private readonly telematicsTelemetryReadingClient: telematicsTelemetryReadingServiceApi.TelemetryReadingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists media assets a page at a time.
   */
  async browseMediaAssets(req: mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseMediaAssets", req);
    this.logger.info("browse_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.estimateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse.fromPartial({ mediaAssets: [{ specs: (reply1?.translationKey?.specs ?? {}) }] });
  }

  /**
   * Counts media assets by status.
   */
  async countMediaAssets(req: mediaMediaAssetQueryServiceApi.CountMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.CountMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountMediaAssets", req);
    this.logger.info("count_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      transcodeJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        history: [{ changedAt: req?.filter?.createdAfter }],
      },
    });
    const invoke1: Unary<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.lintTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetQueryServiceApi.CountMediaAssetsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        status: (reply1?.outcome?.status ?? ""),
      },
    });
  }

  /**
   * Streams every matching media asset.
   */
  async exportMediaAssets(req: mediaMediaAssetQueryServiceApi.ExportMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.ExportMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportMediaAssets", req);
    this.logger.info("export_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.SuggestProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.SuggestProfilesRequest, personalizationProfileQueryServiceApi.SuggestProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.suggestProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = auditAuditEventServiceApi.BatchGetAuditEventsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.batchGetAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      mediaMediaAssetQueryServiceApi.ExportMediaAssetsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetQueryServiceApi.ExportMediaAssetsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Lists media assets a page at a time.
   */
  async findMediaAssets(req: mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindMediaAssets", req);
    this.logger.info("find_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const method1 = "compareMediaAssetOptions" as const;
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse.fromPartial({
      mediaAssets: [{
        audit: {
          createdAt: reply1?.mediaAsset?.audit?.createdAt,
          updatedAt: reply1?.mediaAsset?.audit?.updatedAt,
        },
      }],
    });
  }

  /**
   * Returns a media asset.
   */
  async lookupMediaAsset(req: mediaMediaAssetQueryServiceApi.LookupMediaAssetRequest): Promise<mediaMediaAssetQueryServiceApi.LookupMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupMediaAsset", req);
    this.logger.info("lookup_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.WatchAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.context?.actor?.userId ?? "") },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.authorizationAccessPolicyClient.watchAccessPolicies(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? authorizationAccessPolicyServiceApi.WatchAccessPoliciesResponse.fromPartial({});
    const request2 = telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.mediaAssetId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream2 = this.telematicsTelemetryReadingClient.watchTelemetryReadings(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsResponse.fromPartial({});
    return mediaMediaAssetQueryServiceApi.LookupMediaAssetResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } });
  }

  /**
   * Returns a media asset.
   */
  async peekMediaAsset(req: mediaMediaAssetQueryServiceApi.PeekMediaAssetRequest): Promise<mediaMediaAssetQueryServiceApi.PeekMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekMediaAsset", req);
    this.logger.info("peek_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        audit: { updatedAt: req?.context?.deadline },
        components: { primary: { componentId: (req?.mediaAssetId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.metricsMetricSeriesClient);
    const invoke1: Unary<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse> =
      (input, done) => proxy1.cloneMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(invoke1, request1);
    return mergeResponses(
      mediaMediaAssetQueryServiceApi.PeekMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedBy: (reply1?.metricSeries?.audit?.updatedBy ?? "") } },
      }),
      mediaMediaAssetQueryServiceApi.PeekMediaAssetResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } }),
    );
  }

  /**
   * Returns several media assets at once.
   */
  async resolveMediaAssets(req: mediaMediaAssetQueryServiceApi.ResolveMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.ResolveMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveMediaAssets", req);
    this.logger.info("resolve_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    return mediaMediaAssetQueryServiceApi.ResolveMediaAssetsResponse.fromPartial({});
  }

  /**
   * Summarizes a media asset.
   */
  async summarizeMediaAssets(req: mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsRequest): Promise<mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeMediaAssets", req);
    this.logger.info("summarize_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.FindDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.mediaAssetId ?? ""),
      },
    });
    const invoke1: Unary<documentsDocumentQueryServiceApi.FindDocumentsRequest, documentsDocumentQueryServiceApi.FindDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.findDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentQueryServiceApi.FindDocumentsRequest, documentsDocumentQueryServiceApi.FindDocumentsResponse>(invoke1, request1);
    const request2 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.explainTranslationKeyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({
      context: input3?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          recipient: ((reply2?.translationKey?.locator?.$case === "address" ? reply2?.translationKey?.locator.address : undefined)?.recipient ?? ""),
        } },
        owner: { email: (reply2?.translationKey?.owner?.email ?? "") },
      },
    });
    const invoke3: Unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.recalculateMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(invoke3, request3);
    const request4 = surveysQuestionValidationServiceApi.ScoreQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: { createdBy: (reply2?.translationKey?.audit?.createdBy ?? "") },
      },
    });
    const cloned4: surveysQuestionValidationServiceApi.ScoreQuestionRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.scoreQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          message: (reply4?.result?.message ?? ""),
        },
      }),
      mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for MediaAssetQueryService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetQueryHandler {
  constructor(@inject(MediaAssetQueryWorkflow) private readonly workflow: MediaAssetQueryWorkflow) {}

  /**
   * Lists media assets a page at a time.
   */
  browseMediaAssets = unary<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest, mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse>(
    (request) => this.workflow.browseMediaAssets(request),
  );

  /**
   * Counts media assets by status.
   */
  countMediaAssets = unary<mediaMediaAssetQueryServiceApi.CountMediaAssetsRequest, mediaMediaAssetQueryServiceApi.CountMediaAssetsResponse>(
    (request) => this.workflow.countMediaAssets(request),
  );

  /**
   * Streams every matching media asset.
   */
  exportMediaAssets = serverStream<mediaMediaAssetQueryServiceApi.ExportMediaAssetsRequest, mediaMediaAssetQueryServiceApi.ExportMediaAssetsResponse>(
    (request) => this.workflow.exportMediaAssets(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  findMediaAssets = unary<mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest, mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse>(
    (request) => this.workflow.findMediaAssets(request),
  );

  /**
   * Returns a media asset.
   */
  lookupMediaAsset = unary<mediaMediaAssetQueryServiceApi.LookupMediaAssetRequest, mediaMediaAssetQueryServiceApi.LookupMediaAssetResponse>(
    (request) => this.workflow.lookupMediaAsset(request),
  );

  /**
   * Returns a media asset.
   */
  peekMediaAsset = (call: ServerUnaryCall<mediaMediaAssetQueryServiceApi.PeekMediaAssetRequest, mediaMediaAssetQueryServiceApi.PeekMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetQueryServiceApi.PeekMediaAssetResponse>): void => {
    void this.workflow.peekMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns several media assets at once.
   */
  resolveMediaAssets = unary<mediaMediaAssetQueryServiceApi.ResolveMediaAssetsRequest, mediaMediaAssetQueryServiceApi.ResolveMediaAssetsResponse>(
    (request) => this.workflow.resolveMediaAssets(request),
  );

  /**
   * Summarizes a media asset.
   */
  summarizeMediaAssets = unary<mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsRequest, mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse>(
    (request) => this.workflow.summarizeMediaAssets(request),
  );
}

export function implementation(handler: MediaAssetQueryHandler): mediaMediaAssetQueryServiceApi.MediaAssetQueryServiceServer {
  return {
    browseMediaAssets: handler.browseMediaAssets,
    countMediaAssets: handler.countMediaAssets,
    exportMediaAssets: handler.exportMediaAssets,
    findMediaAssets: handler.findMediaAssets,
    lookupMediaAsset: handler.lookupMediaAsset,
    peekMediaAsset: handler.peekMediaAsset,
    resolveMediaAssets: handler.resolveMediaAssets,
    summarizeMediaAssets: handler.summarizeMediaAssets,
  };
}
