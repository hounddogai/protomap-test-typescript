/**
 * Computes the figures of an affinity, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as appointmentsAppointmentServiceApi from "../../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAffinityRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityCalculationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.appointments.v1.AppointmentService") private readonly appointmentsAppointmentClient: appointmentsAppointmentServiceApi.AppointmentServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardQueryService") private readonly fuelFuelCardQueryClient: fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates an affinity.
   */
  async calculateAffinity(req: personalizationAffinityCalculationServiceApi.CalculateAffinityRequest): Promise<personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "CalculateAffinity", req);
    this.logger.info("calculate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.ExplainModerationCalculationRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      moderation: {
        origin: { $case: "customer", customer: { displayName: (req?.affinity?.subject?.displayName ?? "") } },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<communityModerationCalculationServiceApi.ExplainModerationCalculationRequest, communityModerationCalculationServiceApi.ExplainModerationCalculationResponse> =
      (input, done) => this.communityModerationCalculationClient.explainModerationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
      recommendation: {
        audit: {
          createdAt: reply1?.moderation?.audit?.createdAt,
          updatedBy: (reply1?.moderation?.audit?.updatedBy ?? ""),
        },
      },
    });
    const method2 = "compareRecommendationOptions" as const;
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.CalculateAffinityResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      personalizationAffinityCalculationServiceApi.CalculateAffinityResponse.fromPartial({
        affinity: {
          subject: {
            displayName: (reply2?.recommendation?.counterparty?.displayName ?? ""),
          },
        },
      }),
      personalizationAffinityCalculationServiceApi.CalculateAffinityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
      }),
    );
  }

  /**
   * Compares an affinity.
   */
  async compareAffinityOptions(req: personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest): Promise<personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "CompareAffinityOptions", req);
    this.logger.info("compare_affinity_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.featureflagsFeatureFlagQueryClient);
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => proxy1.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke1, request1);
    const request2 = personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest.fromPartial({
      context: req?.context,
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest, personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.getRecommendationRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest, personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse>(invoke2, request2);
    const settled3 = await Promise.allSettled((req?.affinity?.measurements ?? []).map(async (item) => {
      const request3 = personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({
        context: req?.context,
        details: {
          destination: {
            lines: (reply2?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          },
        },
        recommendation: {
          audit: { createdAt: item?.observedAt },
          billingAddress: { locality: (req?.details?.destination?.locality ?? "") },
          settlement: { $case: "card", card: {
            holderName: ((reply2?.recommendation?.settlement?.$case === "card" ? reply2?.recommendation?.settlement.card : undefined)?.holderName ?? ""),
          } },
        },
      });
      const invoke3: Unary<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> =
        (input, done) => this.personalizationRecommendationCalculationClient.quoteRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse.fromPartial({
        affinity: { correlationId: (reply2?.result?.correlationId ?? "") },
        breakdown: { total: reply2?.recommendation?.total },
      }),
      personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Estimates an affinity.
   */
  async estimateAffinity(req: personalizationAffinityCalculationServiceApi.EstimateAffinityRequest): Promise<personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "EstimateAffinity", req);
    this.logger.info("estimate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.LintModerationsRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (req?.affinity?.subject?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse> =
      (input, done) => this.communityModerationValidationClient.lintModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest.fromPartial({
      context: input2?.context,
      details: {
        channel: ((reply1?.moderation?.origin?.$case === "channel" ? reply1?.moderation?.origin.channel : undefined)?.channel ?? ""),
        recipient: {
          email: (reply1?.moderation?.requester?.email ?? ""),
          name: reply1?.moderation?.requester?.name,
          phone: (reply1?.moderation?.requester?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.subscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>(invoke2, request2);
    let selected3_3: string | undefined;
    switch (reply2?.notification?.origin?.$case) {
      case "customer":
        selected3_3 = ((reply2?.notification?.origin?.$case === "customer" ? reply2?.notification?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { updatedAt: reply2?.notification?.audit?.updatedAt },
        owner: {
          displayName: (selected3_3 ?? ""),
          email: (reply2?.notification?.requester?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        destination: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const invoke3: Unary<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.scoreAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(invoke3, request3);
    const request4 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromPartial({
      badge: {
        audit: { createdBy: (reply3?.accessPolicy?.audit?.createdBy ?? "") },
        owner: {
          email: (reply3?.accessPolicy?.owner?.email ?? ""),
          userId: (reply3?.accessPolicy?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded4 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromJSON(
      JSON.parse(JSON.stringify(communityBadgeCalculationServiceApi.RecalculateBadgesRequest.toJSON(request4))),
    );
    const invoke4: Unary<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse> =
      (input, done) => this.communityBadgeCalculationClient.recalculateBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({
        affinity: { subject: { displayName: (reply4?.badge?.owner?.displayName ?? "") } },
      }),
      personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          source: (req?.affinity?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Explains an affinity.
   */
  async explainAffinityCalculation(req: personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationRequest): Promise<personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ExplainAffinityCalculation", req);
    this.logger.info("explain_affinity_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest.fromPartial({ context: req?.context });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.fuel.v1.ResolveFuelCardsRequest",
      value: Buffer.from(fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest.encode(request1).finish()),
    });
    const unpacked1 = fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest.decode(envelope1.value);
    const invoke1: Unary<fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest, fuelFuelCardQueryServiceApi.ResolveFuelCardsResponse> =
      (input, done) => this.fuelFuelCardQueryClient.resolveFuelCards(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest, fuelFuelCardQueryServiceApi.ResolveFuelCardsResponse>(invoke1, unpacked1);
    const tasks2: Array<() => Promise<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>> = [];
    for (const item of (req?.affinity?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
            ownerId: (req?.affinity?.subject?.recommendationId ?? ""),
          },
        });
        const invoke2: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
          (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse.fromPartial({});
    const request3 = communityModerationValidationServiceApi.NormalizeModerationRequest.fromPartial({
      context: req?.context,
      moderation: { requester: { name: req?.details?.contact?.name } },
    });
    const client3 = this.clients.get<communityModerationValidationServiceApi.ModerationValidationServiceClient>("acme.community.v1.ModerationValidationService");
    const invoke3: Unary<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse> =
      (input, done) => client3.normalizeModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          kind: (req?.affinity?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an affinity.
   */
  async getAffinityRates(req: personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest): Promise<personalizationAffinityCalculationServiceApi.GetAffinityRatesResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAffinityRates", req);
    this.logger.info("get_affinity_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return personalizationAffinityCalculationServiceApi.GetAffinityRatesResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } });
  }

  /**
   * Quotes an affinity.
   */
  async quoteAffinity(req: personalizationAffinityCalculationServiceApi.QuoteAffinityRequest): Promise<personalizationAffinityCalculationServiceApi.QuoteAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "QuoteAffinity", req);
    this.logger.info("quote_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ location: { recipient: (req?.details?.destination?.recipient ?? "") } }],
          location: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient.scoreForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromPartial({
      context: req?.context,
      recommendation: { billingAddress: { region: (req?.details?.destination?.region ?? "") } },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.explainRecommendationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.QuoteAffinityResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinityCalculationServiceApi.QuoteAffinityResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      personalizationAffinityCalculationServiceApi.QuoteAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          occurredAt: req?.affinity?.occurredAt,
        },
      }),
    );
  }

  /**
   * Simulates an affinity.
   */
  async simulateAffinity(req: personalizationAffinityCalculationServiceApi.SimulateAffinityRequest): Promise<personalizationAffinityCalculationServiceApi.SimulateAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "SimulateAffinity", req);
    this.logger.info("simulate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.affinity?.measurements ?? []).map(async (item) => {
      const request1 = appointmentsAppointmentServiceApi.ListAppointmentsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          region: (req?.details?.destination?.region ?? ""),
        },
      });
      const invoke1: Unary<appointmentsAppointmentServiceApi.ListAppointmentsRequest, appointmentsAppointmentServiceApi.ListAppointmentsResponse> =
        (input, done) => this.appointmentsAppointmentClient.listAppointments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<appointmentsAppointmentServiceApi.ListAppointmentsRequest, appointmentsAppointmentServiceApi.ListAppointmentsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? appointmentsAppointmentServiceApi.ListAppointmentsResponse.fromPartial({});
    const settled2 = await Promise.allSettled((req?.affinity?.measurements ?? []).map(async (item) => {
      const request2 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
        context: req?.context,
        profile: {
          audit: { createdAt: item?.observedAt },
          identityDocument: { $case: "nationalId", nationalId: { number: (req?.affinity?.subject?.number ?? "") } },
          primaryAddress: {
            lines: (req?.details?.destination?.lines ?? []).map((value) => value),
            postalCode: (req?.details?.destination?.postalCode ?? ""),
          },
        },
      });
      const invoke2: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
        (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse.fromPartial({});
    const request3 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
      recommendation: {
        billingAddress: {
          countryCode: (reply2?.profile?.primaryAddress?.countryCode ?? ""),
          locality: (reply2?.profile?.primaryAddress?.locality ?? ""),
          recipient: (reply2?.profile?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const invoke3: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("SimulateAffinity.SimulateRecommendation", () => call<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityCalculationServiceApi.SimulateAffinityResponse.fromPartial({
        affinity: {
          subject: {
            displayName: (reply3?.recommendation?.counterparty?.displayName ?? ""),
          },
        },
        breakdown: { currencyCode: (reply3?.breakdown?.currencyCode ?? "") },
      }),
      personalizationAffinityCalculationServiceApi.SimulateAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          kind: (req?.affinity?.kind ?? ""),
        },
      }),
    );
  }
}
