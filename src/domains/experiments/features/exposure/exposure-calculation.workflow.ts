/**
 * Computes the figures of an exposure, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toExposureRecord } from "../../data/records.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureCalculationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates an exposure.
   */
  async calculateExposure(req: experimentsExposureCalculationServiceApi.CalculateExposureRequest): Promise<experimentsExposureCalculationServiceApi.CalculateExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "CalculateExposure", req);
    this.logger.info("calculate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
      variant: { owner: { displayName: (req?.exposure?.subject?.displayName ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse> =
      (input, done) => this.experimentsVariantCalculationClient.explainVariantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.CalculateExposureResponse.fromPartial({
        exposure: { subject: { displayName: (reply1?.variant?.owner?.displayName ?? "") } },
      }),
      experimentsExposureCalculationServiceApi.CalculateExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          kind: (req?.exposure?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Compares an exposure.
   */
  async compareExposureOptions(req: experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest): Promise<experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "CompareExposureOptions", req);
    this.logger.info("compare_exposure_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = anomaliesAnomalyServiceApi.SearchAnomaliesRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.exposure?.subject?.startsAt,
        labels: Object.fromEntries(Object.entries((input1?.exposure?.attributes ?? {}))),
        ownerId: (input1?.exposure?.correlationId ?? ""),
        region: (input1?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<anomaliesAnomalyServiceApi.SearchAnomaliesRequest, anomaliesAnomalyServiceApi.SearchAnomaliesResponse> =
      (input, done) => this.anomaliesAnomalyClient.searchAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<anomaliesAnomalyServiceApi.SearchAnomaliesRequest, anomaliesAnomalyServiceApi.SearchAnomaliesResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
      });
      const invoke2: Unary<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse> =
        (input, done) => this.searchSearchIndexQueryClient.suggestSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse.fromPartial({});
    const request3 = experimentsVariantCalculationServiceApi.CalculateVariantRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (req?.details?.destination?.postalCode ?? "") },
      },
    });
    const cloned3: experimentsVariantCalculationServiceApi.CalculateVariantRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient.calculateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>(invoke3, cloned3);
    const request4 = experimentsVariantCalculationServiceApi.EstimateVariantRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const decoded4 = experimentsVariantCalculationServiceApi.EstimateVariantRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsVariantCalculationServiceApi.EstimateVariantRequest.toJSON(request4))),
    );
    const invoke4: Unary<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient.estimateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse.fromPartial({ exposure: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse.fromPartial({
        breakdown: {
          lines: [{
            amount: (reply4?.variant?.action?.$case === "discount" ? reply4?.variant?.action.discount : undefined)?.amount,
          }],
        },
        result: { details: (reply4?.result?.details ?? {}) },
      }),
      experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          sequence: (req?.exposure?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Estimates an exposure.
   */
  async estimateExposure(req: experimentsExposureCalculationServiceApi.EstimateExposureRequest): Promise<experimentsExposureCalculationServiceApi.EstimateExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "EstimateExposure", req);
    this.logger.info("estimate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ExplainExperimentCalculationRequest",
      value: Buffer.from(experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.EstimateExposureResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsExposureCalculationServiceApi.EstimateExposureResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        exposure: { exposureId: (req?.exposureId ?? "") },
      }),
    );
  }

  /**
   * Explains an exposure.
   */
  async explainExposureCalculation(req: experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest): Promise<experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ExplainExposureCalculation", req);
    this.logger.info("explain_exposure_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        participants: [{
          contact: {
            email: (req?.details?.contact?.email ?? ""),
            phone: (req?.details?.contact?.phone ?? ""),
            preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const client1 = this.clients.get<experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient>("acme.experiments.v1.ExperimentCalculationService");
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> =
      (input, done) => client1.recalculateExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>(invoke1, request1);
    const request2 = experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: { postalCode: (reply1?.experiment?.location?.postalCode ?? "") },
        participants: [{
          contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
        }],
        recurrence: { $case: "weekly", weekly: {
          days: ((reply1?.experiment?.recurrence?.$case === "weekly" ? reply1?.experiment?.recurrence.weekly : undefined)?.days ?? []).map((value) => value),
        } },
      },
    });
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.calculateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Quotes an exposure.
   */
  async quoteExposure(req: experimentsExposureCalculationServiceApi.QuoteExposureRequest): Promise<experimentsExposureCalculationServiceApi.QuoteExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "QuoteExposure", req);
    this.logger.info("quote_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.SimulateBadgeRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.simulateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(invoke1, request1));
    const settled2 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = experimentsExperimentCalculationServiceApi.EstimateExperimentRequest.fromPartial({
        context: req?.context,
        details: {
          destination: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        },
        experiment: {
          audit: {
            createdAt: item?.observedAt,
            updatedBy: (reply1?.badge?.audit?.updatedBy ?? ""),
          },
          location: { region: (req?.details?.destination?.region ?? "") },
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
    let selected3_2: number | undefined;
    switch (reply1?.badge?.action?.$case) {
      case "route":
        selected3_2 = ((reply1?.badge?.action?.$case === "route" ? reply1?.badge?.action.route : undefined)?.weight ?? 0);
        break;
      default:
        selected3_2 = 0;
    }
    const request3 = experimentsVariantCalculationServiceApi.EstimateVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          createdAt: reply2?.experiment?.audit?.createdAt,
          etag: (reply2?.experiment?.audit?.etag ?? ""),
          updatedAt: reply1?.badge?.audit?.updatedAt,
        },
        action: { $case: "route", route: { weight: (selected3_2 ?? 0) } },
      },
    });
    const invoke3: Unary<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient.estimateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse>(invoke3, request3);
    const request4 = personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (reply2?.experiment?.location?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
          region: (reply2?.experiment?.location?.region ?? ""),
        },
      },
    });
    const invoke4: Unary<personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest, personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.compareAffinityOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.QuoteExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      experimentsExposureCalculationServiceApi.QuoteExposureResponse.fromPartial({ breakdown: { total: reply3?.breakdown?.total } }),
      experimentsExposureCalculationServiceApi.QuoteExposureResponse.fromPartial({ exposure: { source: (reply4?.affinity?.source ?? "") } }),
      experimentsExposureCalculationServiceApi.QuoteExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          sequence: (req?.exposure?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Recalculates an exposure.
   */
  async recalculateExposures(req: experimentsExposureCalculationServiceApi.RecalculateExposuresRequest): Promise<experimentsExposureCalculationServiceApi.RecalculateExposuresResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "RecalculateExposures", req);
    this.logger.info("recalculate_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ExplainForumDecisionRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
            }],
          }],
        }],
      },
    });
    const reply1 = await this.workQueue.enqueue<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>(
      "acme.experiments.v1.ExposureCalculationService/RecalculateExposures:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureCalculationServiceApi.RecalculateExposuresResponse.fromPartial({
        exposure: { attributes: (reply1?.forum?.attributes ?? {}) },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsExposureCalculationServiceApi.RecalculateExposuresResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Simulates an exposure.
   */
  async simulateExposure(req: experimentsExposureCalculationServiceApi.SimulateExposureRequest): Promise<experimentsExposureCalculationServiceApi.SimulateExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "SimulateExposure", req);
    this.logger.info("simulate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<experimentsVariantCalculationServiceApi.QuoteVariantResponse>> = [];
    for (const item of (req?.exposure?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = experimentsVariantCalculationServiceApi.QuoteVariantRequest.fromPartial({
          context: req?.context,
          details: {
            destination: {
              countryCode: (req?.details?.destination?.countryCode ?? ""),
              lines: (req?.details?.destination?.lines ?? []).map((value) => value),
              locality: (req?.details?.destination?.locality ?? ""),
            },
          },
          variant: { audit: { updatedAt: item?.observedAt } },
        });
        const invoke1: Unary<experimentsVariantCalculationServiceApi.QuoteVariantRequest, experimentsVariantCalculationServiceApi.QuoteVariantResponse> =
          (input, done) => this.experimentsVariantCalculationClient.quoteVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<experimentsVariantCalculationServiceApi.QuoteVariantRequest, experimentsVariantCalculationServiceApi.QuoteVariantResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? experimentsVariantCalculationServiceApi.QuoteVariantResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExposureCalculationServiceApi.SimulateExposureResponse.fromPartial({
      exposure: {
        correlationId: (req?.exposure?.correlationId ?? ""),
        exposureId: (req?.exposureId ?? ""),
      },
    });
  }
}
