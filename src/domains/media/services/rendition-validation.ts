/**
 * Checks renditions against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as ratelimitingRateLimitServiceApi from "../../../../.cache/proto/acme/ratelimiting/v1/rate_limit_service.js";
import * as recommendationsRecommendationSetQueryServiceApi from "../../../../.cache/proto/acme/recommendations/v1/recommendation_set_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRenditionRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionValidationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.ratelimiting.v1.RateLimitService") private readonly ratelimitingRateLimitClient: ratelimitingRateLimitServiceApi.RateLimitServiceClient,
    @inject("grpc:acme.recommendations.v1.RecommendationSetQueryService") private readonly recommendationsRecommendationSetQueryClient: recommendationsRecommendationSetQueryServiceApi.RecommendationSetQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a rendition.
   */
  async checkRenditionEligibility(req: mediaRenditionValidationServiceApi.CheckRenditionEligibilityRequest): Promise<mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "CheckRenditionEligibility", req);
    this.logger.info("check_rendition_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      mediaAsset: {
        locator: { $case: "address", address: {
          countryCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? ""),
        } },
        audit: { updatedBy: (req?.rendition?.audit?.updatedBy ?? "") },
        components: { primary: {
          description: (req?.rendition?.components?.["primary"]?.description ?? ""),
        } },
      },
    });
    const reply1 = await this.workQueue.enqueue<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>(
      "acme.media.v1.RenditionValidationService/CheckRenditionEligibility:0", request1,
    );
    let selected2_2: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected2_2 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_2 = "";
    }
    let selected2_4: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_4 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: {
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
        primaryAddress: {
          recipient: (selected2_4 ?? ""),
          region: (selected2_2 ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? "") } },
    });
    const invoke3: Unary<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.retrySubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((reply3?.subscription?.action?.$case === "block" ? reply3?.subscription?.action.block : undefined)?.reason ?? ""),
    });
    const invoke4: Unary<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest, personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.summarizeRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse.fromPartial({
        rendition: {
          components: { primary: {
            description: (reply1?.mediaAsset?.components?.["primary"]?.description ?? ""),
          } },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse.fromPartial({
        rendition: { audit: { etag: (reply2?.profile?.audit?.etag ?? "") } },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse.fromPartial({
        rendition: { owner: { email: (reply3?.subscription?.owner?.email ?? "") } },
      }),
      mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse.fromPartial({
        rendition: {
          name: (req?.rendition?.name ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a rendition.
   */
  async explainRenditionDecision(req: mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest): Promise<mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ExplainRenditionDecision", req);
    this.logger.info("explain_rendition_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected1_1 ?? "") },
    });
    const invoke1: Unary<recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsRequest, recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsResponse> =
      (input, done) => this.recommendationsRecommendationSetQueryClient.browseRecommendationSets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsRequest, recommendationsRecommendationSetQueryServiceApi.BrowseRecommendationSetsResponse>(invoke1, request1);
    const request2 = venuesVenueQueryServiceApi.FindVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.rendition?.owner?.userId ?? ""),
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const method2 = "findVenues" as const;
    const invoke2: Unary<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async getRenditionRules(req: mediaRenditionValidationServiceApi.GetRenditionRulesRequest): Promise<mediaRenditionValidationServiceApi.GetRenditionRulesResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRenditionRules", req);
    this.logger.info("get_rendition_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        origin: { $case: "customer", customer: { email: (req?.context?.actor?.email ?? "") } },
      },
    });
    const proxy1 = forwarding(this.mediaTranscodeJobCalculationClient);
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest, mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse> =
      (input, done) => proxy1.recalculateTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest, mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          preferredChannel: (reply1?.transcodeJob?.requester?.preferredChannel ?? ""),
        },
      },
      subscription: {
        audit: {
          createdAt: reply1?.transcodeJob?.audit?.createdAt,
          updatedBy: (reply1?.transcodeJob?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.pauseSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>(invoke2, request2);
    return mergeResponses(
      mediaRenditionValidationServiceApi.GetRenditionRulesResponse.fromPartial({
        rendition: { audit: { updatedBy: (reply1?.transcodeJob?.audit?.updatedBy ?? "") } },
      }),
      mediaRenditionValidationServiceApi.GetRenditionRulesResponse.fromPartial({ rendition: { name: (reply2?.subscription?.name ?? "") } }),
      mediaRenditionValidationServiceApi.GetRenditionRulesResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Lints a rendition.
   */
  async lintRenditions(req: mediaRenditionValidationServiceApi.LintRenditionsRequest): Promise<mediaRenditionValidationServiceApi.LintRenditionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "LintRenditions", req);
    this.logger.info("lint_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ratelimitingRateLimitServiceApi.WatchRateLimitsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
      subscriber: {
        name: req?.details?.contact?.name,
        phone: (req?.details?.contact?.phone ?? ""),
        preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.ratelimitingRateLimitClient.watchRateLimits(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? ratelimitingRateLimitServiceApi.WatchRateLimitsResponse.fromPartial({});
    const request2 = communityBadgeCalculationServiceApi.SimulateBadgeRequest.fromPartial({
      badge: {
        audit: { createdBy: (req?.rendition?.audit?.createdBy ?? "") },
        owner: { userId: (req?.rendition?.owner?.userId ?? "") },
      },
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.simulateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = ledgerLedgerAccountValidationServiceApi.ExplainLedgerAccountDecisionRequest.fromPartial({
      context: input3?.context,
      ledgerAccount: {
        audit: {
          etag: (input3?.rendition?.audit?.etag ?? ""),
          updatedAt: input3?.rendition?.audit?.updatedAt,
          updatedBy: (input3?.rendition?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<ledgerLedgerAccountValidationServiceApi.ExplainLedgerAccountDecisionRequest, ledgerLedgerAccountValidationServiceApi.ExplainLedgerAccountDecisionResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.explainLedgerAccountDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountValidationServiceApi.ExplainLedgerAccountDecisionRequest, ledgerLedgerAccountValidationServiceApi.ExplainLedgerAccountDecisionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.LintRenditionsResponse.fromPartial({
        rendition: {
          audit: { createdAt: reply2?.badge?.audit?.createdAt },
          owner: reply2?.badge?.owner,
        },
      }),
      mediaRenditionValidationServiceApi.LintRenditionsResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.outcome?.message ?? ""),
        },
      }),
      mediaRenditionValidationServiceApi.LintRenditionsResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a rendition.
   */
  async normalizeRendition(req: mediaRenditionValidationServiceApi.NormalizeRenditionRequest): Promise<mediaRenditionValidationServiceApi.NormalizeRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "NormalizeRendition", req);
    this.logger.info("normalize_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected1_1 ?? "") },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.countFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(invoke1, request1);
    const request2 = communityPostCalculationServiceApi.EstimatePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.locality ?? ""),
        },
      },
      post: {
        counterparty: { displayName: (req?.rendition?.owner?.displayName ?? "") },
      },
    });
    const decoded2 = communityPostCalculationServiceApi.EstimatePostRequest.fromJSON(
      JSON.parse(JSON.stringify(communityPostCalculationServiceApi.EstimatePostRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse> =
      (input, done) => this.communityPostCalculationClient.estimatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.NormalizeRenditionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaRenditionValidationServiceApi.NormalizeRenditionResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      mediaRenditionValidationServiceApi.NormalizeRenditionResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          status: req?.rendition?.status,
        },
      }),
    );
  }

  /**
   * Previews a rendition.
   */
  async previewRendition(req: mediaRenditionValidationServiceApi.PreviewRenditionRequest): Promise<mediaRenditionValidationServiceApi.PreviewRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "PreviewRendition", req);
    this.logger.info("preview_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.rendition?.owner?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
      subscription: {
        owner: {
          email: (req?.details?.contact?.email ?? ""),
          userId: (req?.rendition?.owner?.userId ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.CancelSubscriptionWorkflowRequest",
      value: Buffer.from(notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.cancelSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse>(invoke1, unpacked1);
    let selected2_4: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected2_4 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = mediaRenditionCalculationServiceApi.SimulateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: { region: (selected2_4 ?? "") } },
        audit: { updatedBy: (reply1?.subscription?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (reply1?.subscription?.owner?.displayName ?? ""),
          userId: (reply1?.subscription?.owner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.simulateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse>(invoke2, request2);
    const request3 = mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.lines ?? []).map((value) => value),
          recipient: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      transcodeJob: {
        assignee: { email: (reply2?.rendition?.owner?.email ?? "") },
        comments: [{ createdAt: reply1?.subscription?.audit?.createdAt }],
      },
    });
    const invoke3: Unary<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.calculateTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.PreviewRenditionResponse.fromPartial({
        rendition: { owner: { userId: (reply1?.subscription?.owner?.userId ?? "") } },
      }),
      mediaRenditionValidationServiceApi.PreviewRenditionResponse.fromPartial({ rendition: { status: reply2?.rendition?.status } }),
      mediaRenditionValidationServiceApi.PreviewRenditionResponse.fromPartial({
        rendition: {
          audit: {
            createdAt: reply3?.transcodeJob?.audit?.createdAt,
            updatedBy: (reply3?.transcodeJob?.audit?.updatedBy ?? ""),
          },
        },
      }),
      mediaRenditionValidationServiceApi.PreviewRenditionResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a rendition.
   */
  async scoreRendition(req: mediaRenditionValidationServiceApi.ScoreRenditionRequest): Promise<mediaRenditionValidationServiceApi.ScoreRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ScoreRendition", req);
    this.logger.info("score_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: { subject: { displayName: (req?.rendition?.owner?.displayName ?? "") } },
    });
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.previewSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(invoke1, request1));
    let selected2_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          countryCode: (selected2_1 ?? ""),
          locality: (req?.details?.destination?.locality ?? ""),
        } },
      },
    });
    const invoke2: Unary<mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest, mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.checkMediaAssetEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest, mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.ScoreRenditionResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaRenditionValidationServiceApi.ScoreRenditionResponse.fromPartial({
        rendition: { owner: { userId: (reply2?.mediaAsset?.owner?.userId ?? "") } },
      }),
      mediaRenditionValidationServiceApi.ScoreRenditionResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a rendition.
   */
  async validateRendition(req: mediaRenditionValidationServiceApi.ValidateRenditionRequest): Promise<mediaRenditionValidationServiceApi.ValidateRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ValidateRendition", req);
    this.logger.info("validate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeRequest, notificationsSubscriptionNotificationServiceApi.SendSubscriptionTestNoticeResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.sendSubscriptionTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = mediaRenditionCalculationServiceApi.QuoteRenditionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.lines ?? []).map((value) => value),
          region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
        },
      },
      rendition: {
        locator: { $case: "address", address: {
          recipient: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? ""),
        } },
        owner: { displayName: (req?.rendition?.owner?.displayName ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>(
      "acme.media.v1.RenditionValidationService/ValidateRendition:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionValidationServiceApi.ValidateRenditionResponse.fromPartial({
        rendition: { audit: { updatedAt: reply1?.subscription?.audit?.updatedAt } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      mediaRenditionValidationServiceApi.ValidateRenditionResponse.fromPartial({ rendition: { status: reply2?.rendition?.status } }),
      mediaRenditionValidationServiceApi.ValidateRenditionResponse.fromPartial({
        rendition: {
          owner: req?.rendition?.owner,
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for RenditionValidationService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionValidationHandler {
  constructor(@inject(RenditionValidationWorkflow) private readonly workflow: RenditionValidationWorkflow) {}

  /**
   * Checks a rendition.
   */
  checkRenditionEligibility = unary<mediaRenditionValidationServiceApi.CheckRenditionEligibilityRequest, mediaRenditionValidationServiceApi.CheckRenditionEligibilityResponse>(
    (request) => this.workflow.checkRenditionEligibility(request),
  );

  /**
   * Explains a rendition.
   */
  explainRenditionDecision = unary<mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest, mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse>(
    (request) => this.workflow.explainRenditionDecision(request),
  );

  /**
   * Returns a rendition.
   */
  getRenditionRules = (call: ServerUnaryCall<mediaRenditionValidationServiceApi.GetRenditionRulesRequest, mediaRenditionValidationServiceApi.GetRenditionRulesResponse>, done: sendUnaryData<mediaRenditionValidationServiceApi.GetRenditionRulesResponse>): void => {
    void this.workflow.getRenditionRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a rendition.
   */
  lintRenditions = unary<mediaRenditionValidationServiceApi.LintRenditionsRequest, mediaRenditionValidationServiceApi.LintRenditionsResponse>(
    (request) => this.workflow.lintRenditions(request),
  );

  /**
   * Normalizes a rendition.
   */
  normalizeRendition = unary<mediaRenditionValidationServiceApi.NormalizeRenditionRequest, mediaRenditionValidationServiceApi.NormalizeRenditionResponse>(
    (request) => this.workflow.normalizeRendition(request),
  );

  /**
   * Previews a rendition.
   */
  previewRendition = (call: ServerUnaryCall<mediaRenditionValidationServiceApi.PreviewRenditionRequest, mediaRenditionValidationServiceApi.PreviewRenditionResponse>, done: sendUnaryData<mediaRenditionValidationServiceApi.PreviewRenditionResponse>): void => {
    void this.workflow.previewRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a rendition.
   */
  scoreRendition = unary<mediaRenditionValidationServiceApi.ScoreRenditionRequest, mediaRenditionValidationServiceApi.ScoreRenditionResponse>(
    (request) => this.workflow.scoreRendition(request),
  );

  /**
   * Validates a rendition.
   */
  validateRendition = unary<mediaRenditionValidationServiceApi.ValidateRenditionRequest, mediaRenditionValidationServiceApi.ValidateRenditionResponse>(
    (request) => this.workflow.validateRendition(request),
  );
}

export function implementation(handler: RenditionValidationHandler): mediaRenditionValidationServiceApi.RenditionValidationServiceServer {
  return {
    checkRenditionEligibility: handler.checkRenditionEligibility,
    explainRenditionDecision: handler.explainRenditionDecision,
    getRenditionRules: handler.getRenditionRules,
    lintRenditions: handler.lintRenditions,
    normalizeRendition: handler.normalizeRendition,
    previewRendition: handler.previewRendition,
    scoreRendition: handler.scoreRendition,
    validateRendition: handler.validateRendition,
  };
}
