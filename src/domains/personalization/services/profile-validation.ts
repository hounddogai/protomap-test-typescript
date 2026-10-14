/**
 * Checks profiles against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as lineageLineageNodeQueryServiceApi from "../../../../.cache/proto/acme/lineage/v1/lineage_node_query_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toProfileRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileValidationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeQueryService") private readonly lineageLineageNodeQueryClient: lineageLineageNodeQueryServiceApi.LineageNodeQueryServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a profile.
   */
  async checkProfileEligibility(req: personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest): Promise<personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CheckProfileEligibility", req);
    this.logger.info("check_profile_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: input1?.context,
      recommendation: {
        audit: { updatedAt: input1?.profile?.audit?.updatedAt },
        billingAddress: { countryCode: (input1?.profile?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse.fromPartial({
        profile: {
          primaryAddress: {
            countryCode: (reply1?.recommendation?.billingAddress?.countryCode ?? ""),
          },
        },
      }),
      personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: req?.profile?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Explains a profile.
   */
  async explainProfileDecision(req: personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest): Promise<personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ExplainProfileDecision", req);
    this.logger.info("explain_profile_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      metricSeries: {
        owner: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
    });
    const cloned1: metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.validateMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesResponse>(invoke1, cloned1);
    const request2 = communityModerationCalculationServiceApi.CalculateModerationRequest.fromPartial({
      context: req?.context,
      moderation: { requester: { email: (req?.profile?.contact?.email ?? "") } },
    });
    const decoded2 = communityModerationCalculationServiceApi.CalculateModerationRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationCalculationServiceApi.CalculateModerationRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse> =
      (input, done) => this.communityModerationCalculationClient.calculateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse.fromPartial({
        profile: {
          relationshipManager: { displayName: (reply1?.metricSeries?.owner?.displayName ?? "") },
        },
      }),
      personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        profile: { contact: { email: (reply2?.moderation?.assignee?.email ?? "") } },
      }),
      personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse.fromPartial({
        profile: {
          primaryAddress: req?.profile?.primaryAddress,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a profile.
   */
  async getProfileRules(req: personalizationProfileValidationServiceApi.GetProfileRulesRequest): Promise<personalizationProfileValidationServiceApi.GetProfileRulesResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetProfileRules", req);
    this.logger.info("get_profile_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: {
          email: (req?.context?.actor?.email ?? ""),
          profileId: (req?.profileId ?? ""),
        },
        issuedAt: req?.context?.deadline,
        metadata: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.RecalculateRecommendationsRequest",
      value: Buffer.from(personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.recalculateRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse>(invoke1, unpacked1);
    const request2 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: {
          updatedAt: reply1?.recommendation?.audit?.updatedAt,
          updatedBy: (reply1?.recommendation?.audit?.updatedBy ?? ""),
        },
        contact: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
        relationshipManager: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
        },
      },
    });
    const client2 = this.clients.get<personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient>("acme.personalization.v1.ProfileCalculationService");
    const invoke2: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => client2.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke2, request2);
    return mergeResponses(
      personalizationProfileValidationServiceApi.GetProfileRulesResponse.fromPartial({
        profile: {
          contact: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
          primaryAddress: { lines: (reply1?.recommendation?.billingAddress?.lines ?? []) },
        },
      }),
      personalizationProfileValidationServiceApi.GetProfileRulesResponse.fromPartial({ profile: { profileId: (reply2?.profile?.profileId ?? "") } }),
    );
  }

  /**
   * Lints a profile.
   */
  async lintProfiles(req: personalizationProfileValidationServiceApi.LintProfilesRequest): Promise<personalizationProfileValidationServiceApi.LintProfilesResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "LintProfiles", req);
    this.logger.info("lint_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest, lineageLineageNodeQueryServiceApi.ResolveLineageNodesResponse> =
      (input, done) => this.lineageLineageNodeQueryClient.resolveLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest, lineageLineageNodeQueryServiceApi.ResolveLineageNodesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.profile?.primaryAddress?.lines ?? []).map((value) => value),
        },
      },
      recommendation: {
        billingAddress: { locality: (req?.profile?.primaryAddress?.locality ?? "") },
        counterparty: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.LintProfilesResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationProfileValidationServiceApi.LintProfilesResponse.fromPartial({
        profile: {
          contact: { email: (reply2?.recommendation?.counterparty?.email ?? "") },
        },
      }),
      personalizationProfileValidationServiceApi.LintProfilesResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          status: req?.profile?.status,
        },
      }),
    );
  }

  /**
   * Normalizes a profile.
   */
  async normalizeProfile(req: personalizationProfileValidationServiceApi.NormalizeProfileRequest): Promise<personalizationProfileValidationServiceApi.NormalizeProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "NormalizeProfile", req);
    this.logger.info("normalize_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.profile?.primaryAddress?.lines ?? []).map((value) => value),
        },
      },
      recommendation: {
        audit: {
          etag: (req?.profile?.audit?.etag ?? ""),
          updatedBy: (req?.profile?.audit?.updatedBy ?? ""),
        },
        billingAddress: { countryCode: (req?.profile?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("NormalizeProfile.CompareRecommendationOptions", () => call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(invoke1, request1));
    const request2 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { updatedBy: (req?.profile?.audit?.updatedBy ?? "") },
        settlement: { $case: "bank", bank: {
          iban: ((reply1?.recommendation?.settlement?.$case === "bank" ? reply1?.recommendation?.settlement.bank : undefined)?.iban ?? ""),
        } },
        counterparty: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.NormalizeProfileResponse.fromPartial({
        profile: { audit: { etag: (reply1?.recommendation?.audit?.etag ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationProfileValidationServiceApi.NormalizeProfileResponse.fromPartial({
        profile: {
          audit: {
            createdBy: (reply2?.recommendation?.audit?.createdBy ?? ""),
            updatedBy: (reply2?.recommendation?.audit?.updatedBy ?? ""),
          },
        },
      }),
      personalizationProfileValidationServiceApi.NormalizeProfileResponse.fromPartial({
        profile: {
          contact: req?.details?.contact,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a profile.
   */
  async previewProfile(req: personalizationProfileValidationServiceApi.PreviewProfileRequest): Promise<personalizationProfileValidationServiceApi.PreviewProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "PreviewProfile", req);
    this.logger.info("preview_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      profile: {
        preferences: { marketingOptIn: (req?.profile?.preferences?.marketingOptIn ?? false) },
        primaryAddress: { countryCode: (req?.profile?.primaryAddress?.countryCode ?? "") },
        relationshipManager: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(
      "acme.personalization.v1.ProfileValidationService/PreviewProfile:0", request1,
    );
    const request2 = communityPostQueryServiceApi.SummarizePostsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<communityPostQueryServiceApi.SummarizePostsRequest, communityPostQueryServiceApi.SummarizePostsResponse> =
      (input, done) => this.communityPostQueryClient.summarizePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<communityPostQueryServiceApi.SummarizePostsRequest, communityPostQueryServiceApi.SummarizePostsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.PreviewProfileResponse.fromPartial({
        profile: { audit: { updatedBy: (reply1?.profile?.audit?.updatedBy ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      personalizationProfileValidationServiceApi.PreviewProfileResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      personalizationProfileValidationServiceApi.PreviewProfileResponse.fromPartial({
        profile: {
          contact: req?.profile?.contact,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a profile.
   */
  async scoreProfile(req: personalizationProfileValidationServiceApi.ScoreProfileRequest): Promise<personalizationProfileValidationServiceApi.ScoreProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ScoreProfile", req);
    this.logger.info("score_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
      recommendation: { audit: { etag: (req?.profile?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (req?.profile?.primaryAddress?.postalCode ?? "") },
      },
      recommendation: {
        audit: { etag: (req?.profile?.audit?.etag ?? "") },
        billingAddress: { locality: (reply1?.recommendation?.billingAddress?.locality ?? "") },
        settlement: { $case: "card", card: {
          last4: ((reply1?.recommendation?.settlement?.$case === "card" ? reply1?.recommendation?.settlement.card : undefined)?.last4 ?? ""),
        } },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.ScoreProfileResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      personalizationProfileValidationServiceApi.ScoreProfileResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      personalizationProfileValidationServiceApi.ScoreProfileResponse.fromPartial({
        profile: {
          contact: { name: req?.profile?.name },
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a profile.
   */
  async validateProfile(req: personalizationProfileValidationServiceApi.ValidateProfileRequest): Promise<personalizationProfileValidationServiceApi.ValidateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ValidateProfile", req);
    this.logger.info("validate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationValidationServiceApi.ValidateNotificationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.profile?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationValidationServiceApi.ValidateNotificationRequest, notificationsNotificationValidationServiceApi.ValidateNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.validateNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      profile: {
        audit: { updatedAt: reply1?.notification?.audit?.updatedAt },
        identityDocument: { $case: "passport", passport: {
          issuingCountry: ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.issuingCountry ?? ""),
        } },
      },
    });
    const method2 = "explainProfileCalculation" as const;
    const invoke2: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke2, request2);
    const request3 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.profile?.primaryAddress?.locality ?? "") },
      },
    });
    const proxy3 = forwarding(this.personalizationRecommendationCalculationClient);
    const invoke3: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => proxy3.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileValidationServiceApi.ValidateProfileResponse.fromPartial({
        profile: {
          relationshipManager: { userId: (reply1?.notification?.assignee?.userId ?? "") },
        },
      }),
      personalizationProfileValidationServiceApi.ValidateProfileResponse.fromPartial({
        profile: {
          contact: { name: reply2?.profile?.name },
          relationshipManager: { email: (reply2?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      personalizationProfileValidationServiceApi.ValidateProfileResponse.fromPartial({
        profile: {
          primaryAddress: { lines: (reply3?.recommendation?.billingAddress?.lines ?? []) },
          relationshipManager: { email: (reply3?.recommendation?.counterparty?.email ?? "") },
        },
      }),
      personalizationProfileValidationServiceApi.ValidateProfileResponse.fromPartial({
        profile: {
          attributes: (req?.profile?.attributes ?? {}),
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ProfileValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileValidationHandler {
  constructor(@inject(ProfileValidationWorkflow) private readonly workflow: ProfileValidationWorkflow) {}

  /**
   * Checks a profile.
   */
  checkProfileEligibility = unary<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse>(
    (request) => this.workflow.checkProfileEligibility(request),
  );

  /**
   * Explains a profile.
   */
  explainProfileDecision = unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse>(
    (request) => this.workflow.explainProfileDecision(request),
  );

  /**
   * Returns a profile.
   */
  getProfileRules = (call: ServerUnaryCall<personalizationProfileValidationServiceApi.GetProfileRulesRequest, personalizationProfileValidationServiceApi.GetProfileRulesResponse>, done: sendUnaryData<personalizationProfileValidationServiceApi.GetProfileRulesResponse>): void => {
    void this.workflow.getProfileRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a profile.
   */
  lintProfiles = unary<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse>(
    (request) => this.workflow.lintProfiles(request),
  );

  /**
   * Normalizes a profile.
   */
  normalizeProfile = unary<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse>(
    (request) => this.workflow.normalizeProfile(request),
  );

  /**
   * Previews a profile.
   */
  previewProfile = (call: ServerUnaryCall<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse>, done: sendUnaryData<personalizationProfileValidationServiceApi.PreviewProfileResponse>): void => {
    void this.workflow.previewProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a profile.
   */
  scoreProfile = unary<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse>(
    (request) => this.workflow.scoreProfile(request),
  );

  /**
   * Validates a profile.
   */
  validateProfile = unary<personalizationProfileValidationServiceApi.ValidateProfileRequest, personalizationProfileValidationServiceApi.ValidateProfileResponse>(
    (request) => this.workflow.validateProfile(request),
  );
}

export function implementation(handler: ProfileValidationHandler): personalizationProfileValidationServiceApi.ProfileValidationServiceServer {
  return {
    checkProfileEligibility: handler.checkProfileEligibility,
    explainProfileDecision: handler.explainProfileDecision,
    getProfileRules: handler.getProfileRules,
    lintProfiles: handler.lintProfiles,
    normalizeProfile: handler.normalizeProfile,
    previewProfile: handler.previewProfile,
    scoreProfile: handler.scoreProfile,
    validateProfile: handler.validateProfile,
  };
}
