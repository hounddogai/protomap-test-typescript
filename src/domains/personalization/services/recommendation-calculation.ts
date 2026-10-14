/**
 * Computes the figures of a recommendation, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
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
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRecommendationRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationCalculationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a recommendation.
   */
  async calculateRecommendation(req: personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest): Promise<personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "CalculateRecommendation", req);
    this.logger.info("calculate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { email: (req?.recommendation?.counterparty?.email ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.notifySubscriptionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const settled2 = await Promise.allSettled((req?.recommendation?.lines ?? []).map(async (item) => {
      const request2 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
        annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        context: req?.context,
        details: { filters: Object.fromEntries(Object.entries((item?.attributes ?? {}))) },
        reason: ((reply1?.subscription?.action?.$case === "block" ? reply1?.subscription?.action.block : undefined)?.reason ?? ""),
      });
      const invoke2: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
        (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse.fromPartial({});
    const request3 = notificationsNotificationServiceApi.BatchCreateNotificationsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.recommendation?.counterparty?.profileId ?? ""),
        submittedBy: { email: (req?.recommendation?.counterparty?.email ?? "") },
      } },
    });
    const reply3 = await upload<notificationsNotificationServiceApi.BatchCreateNotificationsRequest, notificationsNotificationServiceApi.BatchCreateNotificationsResponse>(
      (done) => this.notificationsNotificationClient.batchCreateNotifications(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    const request4 = personalizationProfileCalculationServiceApi.GetProfileRatesRequest.fromPartial({
      context: req?.context,
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
    });
    const invoke4: Unary<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.getProfileRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse.fromPartial({
        recommendation: {
          audit: {
            etag: (reply1?.subscription?.audit?.etag ?? ""),
            updatedBy: (reply1?.subscription?.audit?.updatedBy ?? ""),
          },
        },
      }),
      personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: {
            email: (reply4?.profile?.contact?.email ?? ""),
            profileId: (reply4?.profile?.profileId ?? ""),
          },
        },
      }),
      personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse.fromPartial({
        recommendation: {
          number: (req?.recommendation?.number ?? ""),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a recommendation.
   */
  async compareRecommendationOptions(req: personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest): Promise<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "CompareRecommendationOptions", req);
    this.logger.info("compare_recommendation_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
      profile: {
        audit: { createdAt: req?.recommendation?.audit?.createdAt },
        primaryAddress: { region: (req?.recommendation?.billingAddress?.region ?? "") },
      },
    });
    const method1 = "recalculateProfiles" as const;
    const invoke1: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse.fromPartial({
        recommendation: {
          counterparty: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse.fromPartial({
        recommendation: {
          issuedAt: req?.recommendation?.issuedAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a recommendation.
   */
  async estimateRecommendation(req: personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest): Promise<personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "EstimateRecommendation", req);
    this.logger.info("estimate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      profile: {
        primaryAddress: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          lines: (req?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          region: (req?.recommendation?.billingAddress?.region ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.personalizationProfileCalculationClient);
    const invoke1: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => proxy1.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke1, request1);
    const request2 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke2, request2);
    const request3 = authorizationAccessPolicyQueryServiceApi.BrowseAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.profile?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply2?.profile?.profileId ?? ""),
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<authorizationAccessPolicyQueryServiceApi.BrowseAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.BrowseAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.browseAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyQueryServiceApi.BrowseAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.BrowseAccessPoliciesResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse.fromPartial({
        recommendation: { lines: [{ attributes: (reply1?.profile?.attributes ?? {}) }] },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse.fromPartial({
        recommendation: {
          number: ((reply2?.profile?.identityDocument?.$case === "passport" ? reply2?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
      }),
      personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse.fromPartial({
        recommendation: {
          metadata: (req?.recommendation?.metadata ?? {}),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a recommendation.
   */
  async explainRecommendationCalculation(req: personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest): Promise<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ExplainRecommendationCalculation", req);
    this.logger.info("explain_recommendation_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest.fromPartial({
      context: input1?.context,
      subscription: { audit: { createdAt: input1?.recommendation?.audit?.createdAt } },
    });
    const invoke1: Unary<notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.compareSubscriptionVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse>(invoke1, request1);
    const request2 = personalizationProfileCalculationServiceApi.EstimateProfileRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.recommendation?.billingAddress?.recipient ?? "") },
      },
      profile: {
        contact: {
          email: (reply1?.subscription?.owner?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
        relationshipManager: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
      },
    });
    const cloned2: personalizationProfileCalculationServiceApi.EstimateProfileRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.estimateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse.fromPartial({
        recommendation: {
          counterparty: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse.fromPartial({
        recommendation: {
          billingAddress: { lines: (reply2?.profile?.primaryAddress?.lines ?? []) },
          number: ((reply2?.profile?.identityDocument?.$case === "nationalId" ? reply2?.profile?.identityDocument.nationalId : undefined)?.number ?? ""),
        },
      }),
      personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse.fromPartial({
        recommendation: {
          recommendationId: (req?.recommendationId ?? ""),
          total: req?.recommendation?.total,
        },
      }),
    );
  }

  /**
   * Returns a recommendation.
   */
  async getRecommendationRates(req: personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest): Promise<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRecommendationRates", req);
    this.logger.info("get_recommendation_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.recommendationId ?? ""),
      },
    });
    const decoded1 = notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.listNotificationSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>(invoke1, decoded1);
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Quotes a recommendation.
   */
  async quoteRecommendation(req: personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest): Promise<personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "QuoteRecommendation", req);
    this.logger.info("quote_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.BrowseForumsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.recommendation?.billingAddress?.region ?? "") },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.BrowseForumsRequest",
      value: Buffer.from(communityForumQueryServiceApi.BrowseForumsRequest.encode(request1).finish()),
    });
    const unpacked1 = communityForumQueryServiceApi.BrowseForumsRequest.decode(envelope1.value);
    const invoke1: Unary<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse> =
      (input, done) => this.communityForumQueryClient.browseForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse>(invoke1, unpacked1);
    const request2 = personalizationProfileCalculationServiceApi.GetProfileRatesRequest.fromPartial({
      context: req?.context,
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
    });
    const client2 = this.clients.get<personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient>("acme.personalization.v1.ProfileCalculationService");
    const invoke2: Unary<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse> =
      (input, done) => client2.getProfileRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse.fromPartial({
        recommendation: {
          billingAddress: { lines: (reply2?.profile?.primaryAddress?.lines ?? []) },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse.fromPartial({
        recommendation: {
          metadata: (req?.recommendation?.metadata ?? {}),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a recommendation.
   */
  async recalculateRecommendations(req: personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest): Promise<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "RecalculateRecommendations", req);
    this.logger.info("recalculate_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.GetProfileRatesRequest.fromPartial({
      context: req?.context,
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.getProfileRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse.fromPartial({
        recommendation: {
          billingAddress: { recipient: (reply1?.profile?.primaryAddress?.recipient ?? "") },
          counterparty: { profileId: (reply1?.profile?.profileId ?? "") },
        },
      }),
      personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse.fromPartial({
        breakdown: { total: req?.recommendation?.total },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Simulates a recommendation.
   */
  async simulateRecommendation(req: personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest): Promise<personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "SimulateRecommendation", req);
    this.logger.info("simulate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { region: (req?.recommendation?.billingAddress?.region ?? "") },
      },
      profile: {
        primaryAddress: {
          countryCode: (req?.recommendation?.billingAddress?.countryCode ?? ""),
          postalCode: (req?.recommendation?.billingAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse.fromPartial({
        recommendation: { total: reply1?.breakdown?.total },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse.fromPartial({
        recommendation: {
          billingAddress: req?.recommendation?.billingAddress,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for RecommendationCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationCalculationHandler {
  constructor(@inject(RecommendationCalculationWorkflow) private readonly workflow: RecommendationCalculationWorkflow) {}

  /**
   * Calculates a recommendation.
   */
  calculateRecommendation = unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(
    (request) => this.workflow.calculateRecommendation(request),
  );

  /**
   * Compares a recommendation.
   */
  compareRecommendationOptions = unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(
    (request) => this.workflow.compareRecommendationOptions(request),
  );

  /**
   * Estimates a recommendation.
   */
  estimateRecommendation = (call: ServerUnaryCall<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>, done: sendUnaryData<personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>): void => {
    void this.workflow.estimateRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a recommendation.
   */
  explainRecommendationCalculation = unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(
    (request) => this.workflow.explainRecommendationCalculation(request),
  );

  /**
   * Returns a recommendation.
   */
  getRecommendationRates = unary<personalizationRecommendationCalculationServiceApi.GetRecommendationRatesRequest, personalizationRecommendationCalculationServiceApi.GetRecommendationRatesResponse>(
    (request) => this.workflow.getRecommendationRates(request),
  );

  /**
   * Quotes a recommendation.
   */
  quoteRecommendation = (call: ServerUnaryCall<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>, done: sendUnaryData<personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>): void => {
    void this.workflow.quoteRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a recommendation.
   */
  recalculateRecommendations = unary<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse>(
    (request) => this.workflow.recalculateRecommendations(request),
  );

  /**
   * Simulates a recommendation.
   */
  simulateRecommendation = unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>(
    (request) => this.workflow.simulateRecommendation(request),
  );
}

export function implementation(handler: RecommendationCalculationHandler): personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceServer {
  return {
    calculateRecommendation: handler.calculateRecommendation,
    compareRecommendationOptions: handler.compareRecommendationOptions,
    estimateRecommendation: handler.estimateRecommendation,
    explainRecommendationCalculation: handler.explainRecommendationCalculation,
    getRecommendationRates: handler.getRecommendationRates,
    quoteRecommendation: handler.quoteRecommendation,
    recalculateRecommendations: handler.recalculateRecommendations,
    simulateRecommendation: handler.simulateRecommendation,
  };
}
