/**
 * Checks recommendations against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as toursTourServiceApi from "../../../../.cache/proto/acme/tours/v1/tour_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRecommendationRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationValidationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.tours.v1.TourService") private readonly toursTourClient: toursTourServiceApi.TourServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a recommendation.
   */
  async checkRecommendationEligibility(req: personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest): Promise<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "CheckRecommendationEligibility", req);
    this.logger.info("check_recommendation_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.recommendation?.lines ?? []).map(async (item) => {
      const request1 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
        context: req?.context,
        recommendation: {
          lines: [{
            amount: item?.tax?.amount,
            tax: {
              amount: item?.amount,
              jurisdiction: (item?.tax?.jurisdiction ?? ""),
              rate: (item?.tax?.rate ?? 0),
            },
          }],
        },
      });
      const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
        (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.recommendation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.listDeliveryAttemptVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const settled3 = await Promise.allSettled((req?.recommendation?.attachments ?? []).map(async (item) => {
      const request3 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
        context: req?.context,
        recommendation: {
          attachments: [{
            contentType: (item?.contentType ?? ""),
            fileName: (item?.fileName ?? ""),
            sizeBytes: (item?.sizeBytes ?? 0),
            uri: (item?.uri ?? ""),
          }],
        },
      });
      const invoke3: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
        (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse.fromPartial({});
    const request4 = communityPostCalculationServiceApi.EstimatePostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { locality: (req?.recommendation?.billingAddress?.locality ?? "") },
      },
    });
    const reply4 = await this.workQueue.enqueue<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>(
      "acme.personalization.v1.RecommendationValidationService/CheckRecommendationEligibility:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse.fromPartial({
        recommendation: {
          counterparty: { displayName: (reply4?.post?.counterparty?.displayName ?? "") },
        },
      }),
      personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse.fromPartial({
        recommendation: {
          recommendationId: (req?.recommendationId ?? ""),
          total: req?.recommendation?.total,
        },
      }),
    );
  }

  /**
   * Explains a recommendation.
   */
  async explainRecommendationDecision(req: personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest): Promise<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ExplainRecommendationDecision", req);
    this.logger.info("explain_recommendation_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>> = [];
    for (const item of (req?.recommendation?.attachments ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
          context: req?.context,
          recommendation: { attachments: [{ fileName: (item?.fileName ?? "") }] },
        });
        const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
          (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse.fromPartial({});
    const request2 = personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      profile: {
        relationshipManager: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse> =
      (input, done) => this.personalizationProfileValidationClient.checkProfileEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse.fromPartial({
        recommendation: { audit: { etag: (reply2?.profile?.audit?.etag ?? "") } },
      }),
      personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse.fromPartial({
        recommendation: {
          issuedAt: req?.recommendation?.issuedAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a recommendation.
   */
  async getRecommendationRules(req: personalizationRecommendationValidationServiceApi.GetRecommendationRulesRequest): Promise<personalizationRecommendationValidationServiceApi.GetRecommendationRulesResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRecommendationRules", req);
    this.logger.info("get_recommendation_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        issuedAt: req?.context?.deadline,
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
      recommendationId: (req?.recommendationId ?? ""),
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.quoteRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { createdBy: (reply1?.recommendation?.audit?.createdBy ?? "") },
        settlement: { $case: "bank", bank: {
          accountHolder: ((reply1?.recommendation?.settlement?.$case === "bank" ? reply1?.recommendation?.settlement.bank : undefined)?.accountHolder ?? ""),
        } },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.GetRecommendationRulesResponse.fromPartial({
        recommendation: {
          billingAddress: { lines: (reply1?.recommendation?.billingAddress?.lines ?? []) },
        },
      }),
      personalizationRecommendationValidationServiceApi.GetRecommendationRulesResponse.fromPartial({
        recommendation: {
          billingAddress: { recipient: (reply2?.recommendation?.billingAddress?.recipient ?? "") },
        },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      personalizationRecommendationValidationServiceApi.GetRecommendationRulesResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Lints a recommendation.
   */
  async lintRecommendations(req: personalizationRecommendationValidationServiceApi.LintRecommendationsRequest): Promise<personalizationRecommendationValidationServiceApi.LintRecommendationsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "LintRecommendations", req);
    this.logger.info("lint_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.UpdateMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: { audit: { etag: (req?.recommendation?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<metricsMetricSeriesServiceApi.UpdateMetricSeriesRequest, metricsMetricSeriesServiceApi.UpdateMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesClient.updateMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = communityModerationValidationServiceApi.PreviewModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: {
          displayName: (reply1?.metricSeries?.owner?.displayName ?? ""),
          email: (req?.recommendation?.counterparty?.email ?? ""),
        },
        requester: { name: req?.details?.contact?.name },
      },
    });
    const method2 = "previewModeration" as const;
    const invoke2: Unary<communityModerationValidationServiceApi.PreviewModerationRequest, communityModerationValidationServiceApi.PreviewModerationResponse> =
      (input, done) => this.communityModerationValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationValidationServiceApi.PreviewModerationRequest, communityModerationValidationServiceApi.PreviewModerationResponse>(invoke2, request2);
    const request3 = notificationsNotificationValidationServiceApi.ValidateNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (reply1?.metricSeries?.owner?.displayName ?? "") },
      },
    });
    const proxy3 = forwarding(this.notificationsNotificationValidationClient);
    const invoke3: Unary<notificationsNotificationValidationServiceApi.ValidateNotificationRequest, notificationsNotificationValidationServiceApi.ValidateNotificationResponse> =
      (input, done) => proxy3.validateNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationValidationServiceApi.ValidateNotificationRequest, notificationsNotificationValidationServiceApi.ValidateNotificationResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.LintRecommendationsResponse.fromPartial({
        recommendation: { audit: { createdAt: reply1?.metricSeries?.audit?.createdAt } },
      }),
      personalizationRecommendationValidationServiceApi.LintRecommendationsResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        recommendation: { dueAt: reply2?.moderation?.sla?.dueAt },
      }),
      personalizationRecommendationValidationServiceApi.LintRecommendationsResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      personalizationRecommendationValidationServiceApi.LintRecommendationsResponse.fromPartial({
        recommendation: {
          issuedAt: req?.recommendation?.issuedAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a recommendation.
   */
  async normalizeRecommendation(req: personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest): Promise<personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "NormalizeRecommendation", req);
    this.logger.info("normalize_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.LintBadgesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.recommendation?.counterparty?.email ?? "") } },
    });
    const invoke1: Unary<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse> =
      (input, done) => this.communityBadgeValidationClient.lintBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>(invoke1, request1);
    const request2 = metricsMetricSeriesServiceApi.SearchMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.badge?.audit?.createdAt,
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<metricsMetricSeriesServiceApi.SearchMetricSeriesesRequest, metricsMetricSeriesServiceApi.SearchMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesClient.searchMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<metricsMetricSeriesServiceApi.SearchMetricSeriesesRequest, metricsMetricSeriesServiceApi.SearchMetricSeriesesResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest.fromPartial({
      context: input3?.context,
      recommendationId: (input3?.recommendation?.recommendationId ?? ""),
    });
    const invoke3: Unary<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest, personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.getRecommendationRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest, personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse>(invoke3, request3);
    const results4 = await Promise.all((req?.recommendation?.lines ?? []).map(async (item) => {
      const request4 = personalizationProfileValidationServiceApi.PreviewProfileRequest.fromPartial({
        context: req?.context,
        profile: {
          attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          contact: { email: (reply3?.recommendation?.counterparty?.email ?? "") },
          primaryAddress: {
            countryCode: (reply3?.recommendation?.billingAddress?.countryCode ?? ""),
          },
        },
      });
      const invoke4: Unary<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse> =
        (input, done) => this.personalizationProfileValidationClient.previewProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse>(invoke4, request4);
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? personalizationProfileValidationServiceApi.PreviewProfileResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse.fromPartial({
        outcome: {
          message: (reply1?.outcome?.message ?? ""),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        recommendation: {
          audit: { updatedBy: (reply3?.recommendation?.audit?.updatedBy ?? "") },
        },
      }),
      personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse.fromPartial({
        recommendation: {
          recommendationId: (req?.recommendationId ?? ""),
          total: req?.recommendation?.total,
        },
      }),
    );
  }

  /**
   * Previews a recommendation.
   */
  async previewRecommendation(req: personalizationRecommendationValidationServiceApi.PreviewRecommendationRequest): Promise<personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "PreviewRecommendation", req);
    this.logger.info("preview_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.recommendation?.settlement?.$case) {
      case "card":
        selected1_1 = ((req?.recommendation?.settlement?.$case === "card" ? req?.recommendation?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { updatedBy: (req?.recommendation?.audit?.updatedBy ?? "") },
        settlement: { $case: "card", card: { network: (selected1_1 ?? "") } },
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.quoteRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>(invoke1, request1);
    const request2 = toursTourServiceApi.WatchToursRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.recommendation?.billingAddress?.region ?? "") },
      subscriber: {
        email: (reply1?.recommendation?.counterparty?.email ?? ""),
        phone: (req?.details?.contact?.phone ?? ""),
        preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.toursTourClient.watchTours(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? toursTourServiceApi.WatchToursResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse.fromPartial({ recommendation: { notes: (reply1?.recommendation?.notes ?? "") } }),
      personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse.fromPartial({
        recommendation: {
          recommendationId: (req?.recommendationId ?? ""),
          total: req?.recommendation?.total,
        },
      }),
    );
  }

  /**
   * Scores a recommendation.
   */
  async scoreRecommendation(req: personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest): Promise<personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ScoreRecommendation", req);
    this.logger.info("score_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.SimulateModerationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.recommendation?.billingAddress?.countryCode ?? "") },
      },
      moderation: { audit: { etag: (req?.recommendation?.audit?.etag ?? "") } },
    });
    const decoded1 = communityModerationCalculationServiceApi.SimulateModerationRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationCalculationServiceApi.SimulateModerationRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityModerationCalculationServiceApi.SimulateModerationRequest, communityModerationCalculationServiceApi.SimulateModerationResponse> =
      (input, done) => this.communityModerationCalculationClient.simulateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationCalculationServiceApi.SimulateModerationRequest, communityModerationCalculationServiceApi.SimulateModerationResponse>(invoke1, decoded1);
    const request2 = personalizationProfileValidationServiceApi.GetProfileRulesRequest.fromPartial({
      context: req?.context,
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.GetProfileRulesRequest",
      value: Buffer.from(personalizationProfileValidationServiceApi.GetProfileRulesRequest.encode(request2).finish()),
    });
    const unpacked2 = personalizationProfileValidationServiceApi.GetProfileRulesRequest.decode(envelope2.value);
    const invoke2: Unary<personalizationProfileValidationServiceApi.GetProfileRulesRequest, personalizationProfileValidationServiceApi.GetProfileRulesResponse> =
      (input, done) => this.personalizationProfileValidationClient.getProfileRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.GetProfileRulesRequest, personalizationProfileValidationServiceApi.GetProfileRulesResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse.fromPartial({
        recommendation: { audit: { etag: (reply1?.moderation?.audit?.etag ?? "") } },
      }),
      personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse.fromPartial({
        recommendation: {
          billingAddress: { region: (reply2?.profile?.primaryAddress?.region ?? "") },
          counterparty: { email: (reply2?.profile?.contact?.email ?? "") },
        },
      }),
      personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a recommendation.
   */
  async validateRecommendation(req: personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest): Promise<personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ValidateRecommendation", req);
    this.logger.info("validate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdBy: (req?.recommendation?.audit?.createdBy ?? "") },
            location: { recipient: (req?.recommendation?.billingAddress?.recipient ?? "") },
            manager: { displayName: (req?.recommendation?.counterparty?.displayName ?? "") },
          }],
          manager: { email: (req?.details?.contact?.email ?? "") },
        }],
      },
    });
    const client1 = this.clients.get<communityForumValidationServiceApi.ForumValidationServiceClient>("acme.community.v1.ForumValidationService");
    const invoke1: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => client1.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse.fromPartial({
        recommendation: { counterparty: { email: (reply1?.forum?.manager?.email ?? "") } },
      }),
      personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse.fromPartial({
        recommendation: {
          notes: (req?.recommendation?.notes ?? ""),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }
}
