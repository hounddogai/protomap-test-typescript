/**
 * Checks affinities against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionQueryServiceApi from "../../../../../.cache/proto/acme/admissions/v1/admission_query_service.js";
import * as communityBadgeValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityModerationValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as fleetVehicleServiceApi from "../../../../../.cache/proto/acme/fleet/v1/vehicle_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAffinityRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityValidationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionQueryService") private readonly admissionsAdmissionQueryClient: admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleService") private readonly fleetVehicleClient: fleetVehicleServiceApi.VehicleServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks an affinity.
   */
  async checkAffinityEligibility(req: personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest): Promise<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "CheckAffinityEligibility", req);
    this.logger.info("check_affinity_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      recommendation: {
        counterparty: { email: (req?.details?.contact?.email ?? "") },
        recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
      },
    });
    const decoded1 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.normalizeRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        result: { correlationId: (req?.affinity?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Explains an affinity.
   */
  async explainAffinityDecision(req: personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest): Promise<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ExplainAffinityDecision", req);
    this.logger.info("explain_affinity_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.affinity?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.affinity?.subject?.recommendationId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.admissions.v1.SuggestAdmissionsRequest",
      value: Buffer.from(admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest.encode(request1).finish()),
    });
    const unpacked1 = admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest.decode(envelope1.value);
    const invoke1: Unary<admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest, admissionsAdmissionQueryServiceApi.SuggestAdmissionsResponse> =
      (input, done) => this.admissionsAdmissionQueryClient.suggestAdmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest, admissionsAdmissionQueryServiceApi.SuggestAdmissionsResponse>(invoke1, unpacked1);
    const request2 = personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest.fromPartial({
      context: req?.context,
      profile: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
    });
    const client2 = this.clients.get<personalizationProfileValidationServiceApi.ProfileValidationServiceClient>("acme.personalization.v1.ProfileValidationService");
    const invoke2: Unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> =
      (input, done) => client2.explainProfileDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse>(invoke2, request2);
    const tasks3: Array<() => Promise<communityForumValidationServiceApi.ExplainForumDecisionResponse>> = [];
    for (const item of (req?.affinity?.measurements ?? [])) {
      tasks3.push(async () => {
        const request3 = communityForumValidationServiceApi.ExplainForumDecisionRequest.fromPartial({
          context: req?.context,
          forum: {
            children: [{
              children: [{
                audit: { createdAt: item?.observedAt },
                location: { recipient: (reply2?.profile?.primaryAddress?.recipient ?? "") },
                manager: {
                  displayName: (reply2?.profile?.relationshipManager?.displayName ?? ""),
                  userId: (reply2?.profile?.relationshipManager?.userId ?? ""),
                },
              }],
            }],
          },
        });
        const invoke3: Unary<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse> =
          (input, done) => this.communityForumValidationClient.explainForumDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? communityForumValidationServiceApi.ExplainForumDecisionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse.fromPartial({
        outcome: {
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          kind: (req?.affinity?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Lints an affinity.
   */
  async lintAffinities(req: personalizationAffinityValidationServiceApi.LintAffinitiesRequest): Promise<personalizationAffinityValidationServiceApi.LintAffinitiesResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "LintAffinities", req);
    this.logger.info("lint_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleServiceApi.BatchGetVehiclesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<fleetVehicleServiceApi.BatchGetVehiclesRequest, fleetVehicleServiceApi.BatchGetVehiclesResponse> =
      (input, done) => this.fleetVehicleClient.batchGetVehicles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<fleetVehicleServiceApi.BatchGetVehiclesRequest, fleetVehicleServiceApi.BatchGetVehiclesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.contact?.name,
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      profile: {
        identityDocument: { $case: "nationalId", nationalId: { number: (req?.affinity?.subject?.number ?? "") } },
        relationshipManager: { displayName: (req?.affinity?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> =
      (input, done) => this.personalizationProfileValidationClient.explainProfileDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse>(invoke2, request2));
    const request3 = searchSearchIndexServiceApi.CreateSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: { owner: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke3: Unary<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse> =
      (input, done) => this.searchSearchIndexClient.createSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("LintAffinities.CreateSearchIndex", () => call<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse>(invoke3, request3));
    const request4 = personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest.fromPartial({
      affinityId: (req?.affinity?.affinityId ?? ""),
      context: req?.context,
    });
    const invoke4: Unary<personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest, personalizationAffinityCalculationServiceApi.GetAffinityRatesResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.getAffinityRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.LintAffinitiesResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationAffinityValidationServiceApi.LintAffinitiesResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      personalizationAffinityValidationServiceApi.LintAffinitiesResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      personalizationAffinityValidationServiceApi.LintAffinitiesResponse.fromPartial({
        affinity: { subject: { number: (reply4?.affinity?.subject?.number ?? "") } },
      }),
      personalizationAffinityValidationServiceApi.LintAffinitiesResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Normalizes an affinity.
   */
  async normalizeAffinity(req: personalizationAffinityValidationServiceApi.NormalizeAffinityRequest): Promise<personalizationAffinityValidationServiceApi.NormalizeAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "NormalizeAffinity", req);
    this.logger.info("normalize_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.affinity?.measurements ?? []).map(async (item) => {
      const request1 = personalizationProfileValidationServiceApi.ScoreProfileRequest.fromPartial({
        context: req?.context,
        profile: {
          audit: { createdAt: item?.observedAt },
          identityDocument: { $case: "nationalId", nationalId: { number: (req?.affinity?.subject?.number ?? "") } },
          relationshipManager: {
            displayName: (req?.affinity?.subject?.displayName ?? ""),
            email: (req?.details?.contact?.email ?? ""),
          },
        },
      });
      const invoke1: Unary<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse> =
        (input, done) => this.personalizationProfileValidationClient.scoreProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? personalizationProfileValidationServiceApi.ScoreProfileResponse.fromPartial({});
    const request2 = communityBadgeValidationServiceApi.LintBadgesRequest.fromPartial({
      badge: {
        audit: { createdAt: reply1?.profile?.audit?.createdAt },
        owner: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
      },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>(
      "acme.personalization.v1.AffinityValidationService/NormalizeAffinity:1", request2,
    );
    const request3 = searchSearchIndexServiceApi.CreateSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: {
          locality: (reply1?.profile?.primaryAddress?.locality ?? ""),
          region: (reply1?.profile?.primaryAddress?.region ?? ""),
        } },
        owner: {
          displayName: (req?.affinity?.subject?.displayName ?? ""),
          email: (reply1?.profile?.contact?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse> =
      (input, done) => this.searchSearchIndexClient.createSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.NormalizeAffinityResponse.fromPartial({
        affinity: { subject: { displayName: (reply2?.badge?.owner?.displayName ?? "") } },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      personalizationAffinityValidationServiceApi.NormalizeAffinityResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      personalizationAffinityValidationServiceApi.NormalizeAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          correlationId: (req?.affinity?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews an affinity.
   */
  async previewAffinity(req: personalizationAffinityValidationServiceApi.PreviewAffinityRequest): Promise<personalizationAffinityValidationServiceApi.PreviewAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "PreviewAffinity", req);
    this.logger.info("preview_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.NormalizeModerationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse> =
      (input, done) => this.communityModerationValidationClient.normalizeModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityModerationValidationServiceApi.NormalizeModerationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: reply1?.moderation?.requester?.name } },
      metricSeries: {
        audit: {
          etag: (reply1?.moderation?.audit?.etag ?? ""),
          updatedAt: reply1?.moderation?.audit?.updatedAt,
        },
        owner: {
          email: ((reply1?.moderation?.origin?.$case === "customer" ? reply1?.moderation?.origin.customer : undefined)?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.checkMetricSeriesEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.PreviewAffinityResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      personalizationAffinityValidationServiceApi.PreviewAffinityResponse.fromPartial({
        affinity: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      personalizationAffinityValidationServiceApi.PreviewAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Validates an affinity.
   */
  async validateAffinity(req: personalizationAffinityValidationServiceApi.ValidateAffinityRequest): Promise<personalizationAffinityValidationServiceApi.ValidateAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ValidateAffinity", req);
    this.logger.info("validate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.NormalizeProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { phone: (req?.details?.contact?.phone ?? "") },
        identityDocument: { $case: "passport", passport: { number: (req?.affinity?.subject?.number ?? "") } },
      },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.normalizeProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = communityForumQueryServiceApi.SummarizeForumsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const method2 = "summarizeForums" as const;
    const invoke2: Unary<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse> =
      (input, done) => this.communityForumQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityValidationServiceApi.ValidateAffinityResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationAffinityValidationServiceApi.ValidateAffinityResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      personalizationAffinityValidationServiceApi.ValidateAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }
}
