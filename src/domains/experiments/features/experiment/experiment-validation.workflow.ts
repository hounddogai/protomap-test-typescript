/**
 * Checks experiments against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as venuesVenueServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as yardsYardCalculationServiceApi from "../../../../../.cache/proto/acme/yards/v1/yard_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toExperimentRecord } from "../../data/records.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentValidationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("grpc:acme.yards.v1.YardCalculationService") private readonly yardsYardCalculationClient: yardsYardCalculationServiceApi.YardCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks an experiment.
   */
  async checkExperimentEligibility(req: experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest): Promise<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CheckExperimentEligibility", req);
    this.logger.info("check_experiment_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      experiment: {
        participants: [{ contact: { phone: (req?.details?.contact?.phone ?? "") } }],
        recurrence: { $case: "weekly", weekly: {
          interval: ((req?.experiment?.recurrence?.$case === "daily" ? req?.experiment?.recurrence.daily : undefined)?.interval ?? 0),
        } },
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const results2 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request2 = experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest.fromPartial({
        context: req?.context,
        details: {
          destination: {
            countryCode: (req?.experiment?.location?.countryCode ?? ""),
            postalCode: (req?.experiment?.location?.postalCode ?? ""),
          },
        },
        variant: {
          audit: { createdBy: (req?.experiment?.audit?.createdBy ?? "") },
          owner: { email: (item?.contact?.email ?? "") },
        },
      });
      const invoke2: Unary<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse> =
        (input, done) => this.experimentsVariantCalculationClient.compareVariantOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse.fromPartial({});
    let selected3_2: string | undefined;
    switch (reply2?.variant?.action?.$case) {
      case "block":
        selected3_2 = ((reply2?.variant?.action?.$case === "block" ? reply2?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (req?.experiment?.organizer?.displayName ?? "") },
      },
      reason: (selected3_2 ?? ""),
    });
    const invoke3: Unary<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.resolveDeliveryAttemptConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse.fromPartial({
        experiment: { audit: { etag: (reply1?.experiment?.audit?.etag ?? "") } },
      }),
      experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse.fromPartial({
        outcome: {
          referenceId: (reply3?.outcome?.referenceId ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          status: req?.experiment?.status,
        },
      }),
    );
  }

  /**
   * Explains an experiment.
   */
  async explainExperimentDecision(req: experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest): Promise<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ExplainExperimentDecision", req);
    this.logger.info("explain_experiment_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { countryCode: (req?.experiment?.location?.countryCode ?? "") } },
        owner: { email: (req?.experiment?.organizer?.email ?? "") },
      },
    });
    const method1 = "scoreSearchIndex" as const;
    const invoke1: Unary<searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest, searchSearchIndexValidationServiceApi.ScoreSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest, searchSearchIndexValidationServiceApi.ScoreSearchIndexResponse>(invoke1, request1);
    const request2 = searchSearchIndexValidationServiceApi.ValidateSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: { dimensions: { unit: (reply1?.searchIndex?.dimensions?.unit ?? "") } },
    });
    const proxy2 = forwarding(this.searchSearchIndexValidationClient);
    const invoke2: Unary<searchSearchIndexValidationServiceApi.ValidateSearchIndexRequest, searchSearchIndexValidationServiceApi.ValidateSearchIndexResponse> =
      (input, done) => proxy2.validateSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexValidationServiceApi.ValidateSearchIndexRequest, searchSearchIndexValidationServiceApi.ValidateSearchIndexResponse>(invoke2, request2);
    const settled3 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request3 = yardsYardCalculationServiceApi.EstimateYardRequest.fromPartial({
        context: req?.context,
        details: {
          destination: {
            countryCode: ((reply2?.searchIndex?.locator?.$case === "address" ? reply2?.searchIndex?.locator.address : undefined)?.countryCode ?? ""),
            recipient: (req?.experiment?.location?.recipient ?? ""),
          },
        },
        yard: {
          locator: { $case: "address", address: { postalCode: (req?.experiment?.location?.postalCode ?? "") } },
          owner: { email: (item?.contact?.email ?? "") },
        },
      });
      const invoke3: Unary<yardsYardCalculationServiceApi.EstimateYardRequest, yardsYardCalculationServiceApi.EstimateYardResponse> =
        (input, done) => this.yardsYardCalculationClient.estimateYard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<yardsYardCalculationServiceApi.EstimateYardRequest, yardsYardCalculationServiceApi.EstimateYardResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: yardsYardCalculationServiceApi.EstimateYardResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? yardsYardCalculationServiceApi.EstimateYardResponse.fromPartial({});
    const request4 = experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.experiment?.experimentId ?? ""),
    });
    const invoke4: Unary<experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest, experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.getExperimentRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest, experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse.fromPartial({
        experiment: {
          location: {
            region: ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.region ?? ""),
          },
        },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse.fromPartial({ experiment: { status: reply4?.experiment?.status } }),
      experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          organizer: req?.experiment?.organizer,
        },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async getExperimentRules(req: experimentsExperimentValidationServiceApi.GetExperimentRulesRequest): Promise<experimentsExperimentValidationServiceApi.GetExperimentRulesResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExperimentRules", req);
    this.logger.info("get_experiment_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExperimentValidationServiceApi.GetExperimentRulesResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Lints an experiment.
   */
  async lintExperiments(req: experimentsExperimentValidationServiceApi.LintExperimentsRequest): Promise<experimentsExperimentValidationServiceApi.LintExperimentsResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "LintExperiments", req);
    this.logger.info("lint_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
        }],
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.recalculateExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>(invoke1, spread1);
    const tasks2: Array<() => Promise<venuesVenueServiceApi.SearchVenuesResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks2.push(async () => {
        const request2 = venuesVenueServiceApi.SearchVenuesRequest.fromPartial({
          context: req?.context,
          filter: {
            ownerId: (item?.participantId ?? ""),
            region: (reply1?.experiment?.location?.region ?? ""),
          },
        });
        const invoke2: Unary<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse> =
          (input, done) => this.venuesVenueClient.searchVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? venuesVenueServiceApi.SearchVenuesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.LintExperimentsResponse.fromPartial({
        experiment: {
          audit: { createdAt: reply1?.experiment?.audit?.createdAt },
          title: (reply1?.experiment?.title ?? ""),
        },
      }),
      experimentsExperimentValidationServiceApi.LintExperimentsResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          organizer: req?.experiment?.organizer,
        },
      }),
    );
  }

  /**
   * Normalizes an experiment.
   */
  async normalizeExperiment(req: experimentsExperimentValidationServiceApi.NormalizeExperimentRequest): Promise<experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "NormalizeExperiment", req);
    this.logger.info("normalize_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request1 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
        context: req?.context,
        details: {
          contact: { preferredChannel: (item?.contact?.preferredChannel ?? "") },
        },
      });
      const invoke1: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
        (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse.fromPartial({});
    const settled2 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request2 = experimentsExperimentCalculationServiceApi.EstimateExperimentRequest.fromPartial({
        context: req?.context,
        experiment: {
          participants: [{
            contact: {
              phone: (item?.contact?.phone ?? ""),
              preferredChannel: (item?.contact?.preferredChannel ?? ""),
            },
          }],
        },
      });
      const invoke2: Unary<experimentsExperimentCalculationServiceApi.EstimateExperimentRequest, experimentsExperimentCalculationServiceApi.EstimateExperimentResponse> =
        (input, done) => this.experimentsExperimentCalculationClient.estimateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<experimentsExperimentCalculationServiceApi.EstimateExperimentRequest, experimentsExperimentCalculationServiceApi.EstimateExperimentResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: experimentsExperimentCalculationServiceApi.EstimateExperimentResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? experimentsExperimentCalculationServiceApi.EstimateExperimentResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExperimentValidationServiceApi.NormalizeExperimentResponse.fromPartial({
      experiment: {
        experimentId: (req?.experimentId ?? ""),
        title: (req?.experiment?.title ?? ""),
      },
    });
  }

  /**
   * Previews an experiment.
   */
  async previewExperiment(req: experimentsExperimentValidationServiceApi.PreviewExperimentRequest): Promise<experimentsExperimentValidationServiceApi.PreviewExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "PreviewExperiment", req);
    this.logger.info("preview_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: { postalCode: (input1?.experiment?.location?.postalCode ?? "") },
      },
      experiment: {
        recurrence: { $case: "weekly", weekly: {
          days: ((input1?.experiment?.recurrence?.$case === "weekly" ? input1?.experiment?.recurrence.weekly : undefined)?.days ?? []).map((value) => value),
        } },
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.compareExperimentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse>(invoke1, request1);
    const request2 = personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.fromPartial({
      affinity: {
        subject: { displayName: (req?.experiment?.organizer?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
        strict: (req?.details?.strict ?? false),
      },
    });
    const cloned2: personalizationAffinityValidationServiceApi.NormalizeAffinityRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.normalizeAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse>(invoke2, cloned2);
    const request3 = searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { postalCode: (reply1?.experiment?.location?.postalCode ?? "") } },
        audit: { createdBy: (reply1?.experiment?.audit?.createdBy ?? "") },
        owner: { userId: (req?.experiment?.organizer?.userId ?? "") },
      },
    });
    const decoded3 = searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest.toJSON(request3))),
    );
    const invoke3: Unary<searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest, searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityResponse> =
      (input, done) => this.searchSearchIndexValidationClient.checkSearchIndexEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest, searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityResponse>(invoke3, decoded3);
    const request4 = personalizationRecommendationQueryServiceApi.CountRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.experiment?.audit?.createdAt,
        region: (reply1?.experiment?.location?.region ?? ""),
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.CountRecommendationsRequest",
      value: Buffer.from(personalizationRecommendationQueryServiceApi.CountRecommendationsRequest.encode(request4).finish()),
    });
    const unpacked4 = personalizationRecommendationQueryServiceApi.CountRecommendationsRequest.decode(envelope4.value);
    const invoke4: Unary<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.countRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({
        experiment: {
          experimentId: (reply1?.experiment?.experimentId ?? ""),
          location: reply1?.experiment?.location,
        },
      }),
      experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({
        experiment: {
          status: req?.experiment?.status,
          window: req?.experiment?.window,
        },
      }),
    );
  }

  /**
   * Scores an experiment.
   */
  async scoreExperiment(req: experimentsExperimentValidationServiceApi.ScoreExperimentRequest): Promise<experimentsExperimentValidationServiceApi.ScoreExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ScoreExperiment", req);
    this.logger.info("score_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks1.push(async () => {
        const request1 = experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest.fromPartial({
          context: req?.context,
          experiment: { participants: [{ contact: { name: item?.contact?.name } }] },
        });
        const invoke1: Unary<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse> =
          (input, done) => this.experimentsExperimentCalculationClient.compareExperimentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse.fromPartial({});
    const request2 = personalizationProfileValidationServiceApi.LintProfilesRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { createdBy: (reply1?.experiment?.audit?.createdBy ?? "") },
        primaryAddress: {
          lines: (req?.experiment?.location?.lines ?? []).map((value) => value),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        },
        relationshipManager: { email: (req?.experiment?.organizer?.email ?? "") },
      },
    });
    const client2 = this.clients.get<personalizationProfileValidationServiceApi.ProfileValidationServiceClient>("acme.personalization.v1.ProfileValidationService");
    const invoke2: Unary<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse> =
      (input, done) => client2.lintProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse>(invoke2, request2);
    const results3 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request3 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.fromPartial({
        context: req?.context,
        experiment: {
          participants: [{
            contact: {
              email: (item?.contact?.email ?? ""),
              name: item?.contact?.name,
            },
            participantId: (item?.participantId ?? ""),
            required: (item?.required ?? false),
          }],
        },
      });
      const invoke3: Unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> =
        (input, done) => this.experimentsExperimentCalculationClient.simulateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? experimentsExperimentCalculationServiceApi.SimulateExperimentResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.ScoreExperimentResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      experimentsExperimentValidationServiceApi.ScoreExperimentResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        experiment: { experimentId: (req?.experimentId ?? "") },
      }),
    );
  }

  /**
   * Validates an experiment.
   */
  async validateExperiment(req: experimentsExperimentValidationServiceApi.ValidateExperimentRequest): Promise<experimentsExperimentValidationServiceApi.ValidateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ValidateExperiment", req);
    this.logger.info("validate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: {
          lines: (req?.experiment?.location?.lines ?? []).map((value) => value),
          region: (req?.experiment?.location?.region ?? ""),
        },
        organizer: { displayName: (req?.experiment?.organizer?.displayName ?? "") },
        participants: [{ contact: { email: (req?.details?.contact?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.recalculateExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.experimentId ?? ""),
    });
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest, experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.getExperimentRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest, experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentValidationServiceApi.ValidateExperimentResponse.fromPartial({
        experiment: {
          location: {
            postalCode: (reply1?.experiment?.location?.postalCode ?? ""),
            recipient: (reply1?.experiment?.location?.recipient ?? ""),
          },
        },
      }),
      experimentsExperimentValidationServiceApi.ValidateExperimentResponse.fromPartial({
        experiment: { audit: { updatedBy: (reply2?.experiment?.audit?.updatedBy ?? "") } },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      experimentsExperimentValidationServiceApi.ValidateExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }
}
