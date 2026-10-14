/**
 * Answers read-only questions about recommendations, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as forecastingDemandForecastServiceApi from "../../../../.cache/proto/acme/forecasting/v1/demand_forecast_service.js";
import * as fuelFuelCardServiceApi from "../../../../.cache/proto/acme/fuel/v1/fuel_card_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationQueryWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.forecasting.v1.DemandForecastService") private readonly forecastingDemandForecastClient: forecastingDemandForecastServiceApi.DemandForecastServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardService") private readonly fuelFuelCardClient: fuelFuelCardServiceApi.FuelCardServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists recommendations a page at a time.
   */
  async browseRecommendations(req: personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseRecommendations", req);
    this.logger.info("browse_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.FindProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.FindProfilesRequest, personalizationProfileQueryServiceApi.FindProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.findProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationProfileQueryServiceApi.FindProfilesRequest, personalizationProfileQueryServiceApi.FindProfilesResponse>(invoke1, request1));
    const request2 = ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.filter?.ownerId ?? "") },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke2: Unary<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.suggestLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("BrowseRecommendations.SuggestLedgerAccounts", () => call<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
    );
  }

  /**
   * Counts recommendations by status.
   */
  async countRecommendations(req: personalizationRecommendationQueryServiceApi.CountRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.CountRecommendationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountRecommendations", req);
    this.logger.info("count_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardServiceApi.SearchFuelCardsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const invoke1: Unary<fuelFuelCardServiceApi.SearchFuelCardsRequest, fuelFuelCardServiceApi.SearchFuelCardsResponse> =
      (input, done) => this.fuelFuelCardClient.searchFuelCards(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationQueryServiceApi.CountRecommendationsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Streams every matching recommendation.
   */
  async exportRecommendations(req: personalizationRecommendationQueryServiceApi.ExportRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportRecommendations", req);
    this.logger.info("export_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>(
      "acme.personalization.v1.RecommendationQueryService/ExportRecommendations:0", request1,
    );
    const request2 = authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest.fromPartial({
      accessPolicy: {
        owner: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.explainAccessPolicyDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        sequence: (reply1?.affinity?.sequence ?? 0),
      }),
      personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse.fromPartial({
        recommendation: {
          lines: [{
            tax: {
              amount: (reply2?.accessPolicy?.action?.$case === "discount" ? reply2?.accessPolicy?.action.discount : undefined)?.amount,
            },
          }],
        },
      }),
      personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse.fromPartial({
        recommendation: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Lists recommendations a page at a time.
   */
  async findRecommendations(req: personalizationRecommendationQueryServiceApi.FindRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.FindRecommendationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindRecommendations", req);
    this.logger.info("find_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationQueryServiceApi.FindRecommendationsResponse.fromPartial({});
  }

  /**
   * Returns a recommendation.
   */
  async lookupRecommendation(req: personalizationRecommendationQueryServiceApi.LookupRecommendationRequest): Promise<personalizationRecommendationQueryServiceApi.LookupRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupRecommendation", req);
    this.logger.info("lookup_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = forecastingDemandForecastServiceApi.ListDemandForecastsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.recommendationId ?? ""),
      },
    });
    const invoke1: Unary<forecastingDemandForecastServiceApi.ListDemandForecastsRequest, forecastingDemandForecastServiceApi.ListDemandForecastsResponse> =
      (input, done) => this.forecastingDemandForecastClient.listDemandForecasts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<forecastingDemandForecastServiceApi.ListDemandForecastsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      personalizationRecommendationQueryServiceApi.LookupRecommendationResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationQueryServiceApi.LookupRecommendationResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Returns a recommendation.
   */
  async peekRecommendation(req: personalizationRecommendationQueryServiceApi.PeekRecommendationRequest): Promise<personalizationRecommendationQueryServiceApi.PeekRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekRecommendation", req);
    this.logger.info("peek_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.FindProfilesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.context?.deadline },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.FindProfilesRequest, personalizationProfileQueryServiceApi.FindProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.findProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = personalizationProfileQueryServiceApi.ExportProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const stream2 = this.personalizationProfileQueryClient.exportProfiles(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({});
    return mergeResponses(
      personalizationRecommendationQueryServiceApi.PeekRecommendationResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationRecommendationQueryServiceApi.PeekRecommendationResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Returns several recommendations at once.
   */
  async resolveRecommendations(req: personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveRecommendations", req);
    this.logger.info("resolve_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.ExplainModerationCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      moderation: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        audit: { updatedAt: req?.context?.deadline },
      },
    });
    const invoke1: Unary<communityModerationCalculationServiceApi.ExplainModerationCalculationRequest, communityModerationCalculationServiceApi.ExplainModerationCalculationResponse> =
      (input, done) => this.communityModerationCalculationClient.explainModerationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse.fromPartial({
      recommendations: [{ audit: { createdAt: reply1?.moderation?.audit?.createdAt } }],
      result: { status: (reply1?.outcome?.status ?? "") },
    });
  }

  /**
   * Lists recommendations a page at a time.
   */
  async suggestRecommendations(req: personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.SuggestRecommendationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestRecommendations", req);
    this.logger.info("suggest_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest.fromPartial({
      context: req?.context,
      recommendation: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const method1 = "explainRecommendationDecision" as const;
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse> =
      (input, done) => this.personalizationRecommendationValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationQueryServiceApi.SuggestRecommendationsResponse.fromPartial({
      recommendations: [{
        counterparty: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
        },
      }],
    });
  }

  /**
   * Summarizes a recommendation.
   */
  async summarizeRecommendations(req: personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest): Promise<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeRecommendations", req);
    this.logger.info("summarize_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.ExplainModerationDecisionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.communityModerationValidationClient);
    const invoke1: Unary<communityModerationValidationServiceApi.ExplainModerationDecisionRequest, communityModerationValidationServiceApi.ExplainModerationDecisionResponse> =
      (input, done) => proxy1.explainModerationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.ExplainModerationDecisionRequest, communityModerationValidationServiceApi.ExplainModerationDecisionResponse>(invoke1, request1);
    const request2 = communityForumQueryServiceApi.SummarizeForumsRequest.fromPartial({
      context: req?.context,
      details: {
        cron: (req?.details?.cron ?? ""),
        filters: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        period: req?.details?.period,
      },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse> =
      (input, done) => this.communityForumQueryClient.summarizeForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.format ?? "") });
    return mergeResponses(
      personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse.fromPartial({
        reportId: (reply2?.reportId ?? ""),
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
