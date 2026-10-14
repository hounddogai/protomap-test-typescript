/**
 * Checks media assets against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityBadgeValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as driversDriverQueryServiceApi from "../../../../../.cache/proto/acme/drivers/v1/driver_query_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as identityUserValidationServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
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
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetValidationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.drivers.v1.DriverQueryService") private readonly driversDriverQueryClient: driversDriverQueryServiceApi.DriverQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a media asset.
   */
  async checkMediaAssetEligibility(req: mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest): Promise<mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CheckMediaAssetEligibility", req);
    this.logger.info("check_media_asset_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.mediaAsset?.owner?.userId ?? ""),
        region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.countSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse>(invoke1, request1));
    const request2 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CheckMediaAssetEligibility.SummarizeFeatureFlags", () => call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke2, request2));
    const request3 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        } },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke3: Unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.estimateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse.fromPartial({
        mediaAsset: { code: (reply3?.rendition?.code ?? "") },
        outcome: { message: (reply3?.result?.message ?? "") },
      }),
      mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a media asset.
   */
  async explainMediaAssetDecision(req: mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest): Promise<mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ExplainMediaAssetDecision", req);
    this.logger.info("explain_media_asset_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.GetUserRulesRequest.fromPartial({
      context: req?.context,
      userId: (req?.mediaAsset?.owner?.userId ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse>(
      "acme.media.v1.MediaAssetValidationService/ExplainMediaAssetDecision:0", request1,
    );
    const request2 = notificationsNotificationExportServiceApi.StreamNotificationExportRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.user?.primaryAddress?.region ?? "") },
    });
    const stream2 = this.notificationsNotificationExportClient.streamNotificationExport(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsNotificationExportServiceApi.StreamNotificationExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse.fromPartial({ mediaAsset: { audit: { createdAt: reply1?.user?.audit?.createdAt } } }),
      mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a media asset.
   */
  async getMediaAssetRules(req: mediaMediaAssetValidationServiceApi.GetMediaAssetRulesRequest): Promise<mediaMediaAssetValidationServiceApi.GetMediaAssetRulesResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMediaAssetRules", req);
    this.logger.info("get_media_asset_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.listDeliveryAttemptExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>(invoke1, request1));
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.GetMediaAssetRulesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaMediaAssetValidationServiceApi.GetMediaAssetRulesResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } }),
    );
  }

  /**
   * Lints a media asset.
   */
  async lintMediaAssets(req: mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest): Promise<mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "LintMediaAssets", req);
    this.logger.info("lint_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: { requester: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.calculateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          postalCode: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.postalCode ?? ""),
        } },
        audit: { createdAt: reply1?.translationJob?.audit?.createdAt },
        dimensions: { unit: (req?.mediaAsset?.dimensions?.unit ?? "") },
        owner: { email: (reply1?.translationJob?.requester?.email ?? "") },
      },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.simulateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.translationJob?.audit?.createdAt,
        region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream3 = this.notificationsDeliveryAttemptExportClient.streamDeliveryAttemptExport(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse.fromPartial({
        mediaAsset: {
          audit: { etag: (reply2?.mediaAsset?.audit?.etag ?? "") },
          specs: (reply2?.mediaAsset?.specs ?? {}),
        },
      }),
      mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a media asset.
   */
  async normalizeMediaAsset(req: mediaMediaAssetValidationServiceApi.NormalizeMediaAssetRequest): Promise<mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "NormalizeMediaAsset", req);
    this.logger.info("normalize_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: Array<string> | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected1_1 = [];
    }
    let selected1_3: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_3 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          lines: (selected1_1 ?? []),
          postalCode: (selected1_3 ?? ""),
        } },
        components: { primary: {
          description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        } },
        dimensions: { length: (req?.mediaAsset?.dimensions?.length ?? 0) },
      },
    });
    const invoke1: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse.fromPartial({
        mediaAsset: {
          owner: { displayName: (reply1?.rendition?.owner?.displayName ?? "") },
          tags: (reply1?.rendition?.tags ?? []),
        },
      }),
      mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a media asset.
   */
  async previewMediaAsset(req: mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest): Promise<mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "PreviewMediaAsset", req);
    this.logger.info("preview_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.EstimateVariantRequest.fromPartial({
      context: req?.context,
      variant: { audit: { createdBy: (req?.mediaAsset?.audit?.createdBy ?? "") } },
    });
    const method1 = "estimateVariant" as const;
    const invoke1: Unary<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse>(invoke1, request1);
    const request2 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
        },
      },
      mediaAsset: { audit: { etag: (req?.mediaAsset?.audit?.etag ?? "") } },
    });
    const proxy2 = forwarding(this.mediaMediaAssetCalculationClient);
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse> =
      (input, done) => proxy2.compareMediaAssetOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.mediaAsset?.audit?.createdAt,
        region: (selected3_1 ?? ""),
      },
    });
    const invoke3: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse>(invoke3, request3);
    const request4 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
      rendition: {
        components: { primary: {
          description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        } },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse.fromPartial({ mediaAsset: { owner: reply1?.variant?.owner } }),
      mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { createdAt: reply2?.mediaAsset?.audit?.createdAt } },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse.fromPartial({
        mediaAsset: {
          components: { primary: { quantity: (reply4?.rendition?.components?.["primary"]?.quantity ?? 0) } },
          tags: (reply4?.rendition?.tags ?? []),
        },
      }),
      mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          specs: (req?.mediaAsset?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Scores a media asset.
   */
  async scoreMediaAsset(req: mediaMediaAssetValidationServiceApi.ScoreMediaAssetRequest): Promise<mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ScoreMediaAsset", req);
    this.logger.info("score_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest.fromPartial({
      badge: {
        audit: {
          updatedAt: input1?.mediaAsset?.audit?.updatedAt,
          updatedBy: (input1?.mediaAsset?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (input1?.mediaAsset?.owner?.displayName ?? ""),
          userId: (input1?.mediaAsset?.owner?.userId ?? ""),
        },
      },
      context: input1?.context,
    });
    const invoke1: Unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> =
      (input, done) => this.communityBadgeValidationClient.explainBadgeDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse>(invoke1, request1);
    const request2 = mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
        audit: { createdBy: (req?.mediaAsset?.audit?.createdBy ?? "") },
        owner: { userId: (reply1?.badge?.owner?.userId ?? "") },
      },
    });
    const cloned2: mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest, mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse> =
      (input, done) => this.mediaRenditionCalculationClient.explainRenditionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest, mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse>(invoke2, cloned2);
    const request3 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          lines: ((reply2?.rendition?.locator?.$case === "address" ? reply2?.rendition?.locator.address : undefined)?.lines ?? []).map((value) => value),
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        } },
        components: { primary: {
          componentId: (reply2?.rendition?.components?.["primary"]?.componentId ?? ""),
        } },
      },
    });
    const decoded3 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.toJSON(request3))),
    );
    const invoke3: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(invoke3, decoded3);
    const request4 = driversDriverQueryServiceApi.SummarizeDriversRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply2?.rendition?.specs ?? {}))),
        period: reply1?.badge?.effective,
      },
      reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.drivers.v1.SummarizeDriversRequest",
      value: Buffer.from(driversDriverQueryServiceApi.SummarizeDriversRequest.encode(request4).finish()),
    });
    const unpacked4 = driversDriverQueryServiceApi.SummarizeDriversRequest.decode(envelope4.value);
    const invoke4: Unary<driversDriverQueryServiceApi.SummarizeDriversRequest, driversDriverQueryServiceApi.SummarizeDriversResponse> =
      (input, done) => this.driversDriverQueryClient.summarizeDrivers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<driversDriverQueryServiceApi.SummarizeDriversRequest, driversDriverQueryServiceApi.SummarizeDriversResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedBy: (reply1?.badge?.audit?.updatedBy ?? "") } },
      }),
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse.fromPartial({ mediaAsset: { capacity: (reply2?.rendition?.capacity ?? 0) } }),
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse.fromPartial({ mediaAsset: { name: (reply3?.rendition?.name ?? "") } }),
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      mediaMediaAssetValidationServiceApi.ScoreMediaAssetResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a media asset.
   */
  async validateMediaAsset(req: mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest): Promise<mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ValidateMediaAsset", req);
    this.logger.info("validate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: { owner: { userId: (req?.mediaAsset?.owner?.userId ?? "") } },
    });
    const client1 = this.clients.get<mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient>("acme.media.v1.RenditionCalculationService");
    const invoke1: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
      (input, done) => client1.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(invoke1, request1);
    const request2 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { dimensions: { weight: (reply1?.rendition?.dimensions?.weight ?? 0) } },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.estimateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = mediaRenditionCalculationServiceApi.SimulateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { dimensions: { width: (reply1?.rendition?.dimensions?.width ?? 0) } },
    });
    const invoke3: Unary<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.simulateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse.fromPartial({ mediaAsset: { owner: reply1?.rendition?.owner } }),
      mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }
}
