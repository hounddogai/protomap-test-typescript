/**
 * Manages marketing campaigns: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as campaignsCampaignAssetQueryServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as contentArticleQueryServiceApi from "../../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as telehealthVideoVisitCalculationServiceApi from "../../../../../.cache/proto/acme/telehealth/v1/video_visit_calculation_service.js";
import * as venuesVenueValidationServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as yardsYardServiceApi from "../../../../../.cache/proto/acme/yards/v1/yard_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toMarketingCampaignRecord } from "../../data/records.js";
import { CampaignsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate marketing campaign operations and persist audit data.
 */
@injectable()
export class MarketingCampaignWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignAssetQueryService") private readonly campaignsCampaignAssetQueryClient: campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetValidationService") private readonly campaignsCampaignBudgetValidationClient: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.telehealth.v1.VideoVisitCalculationService") private readonly telehealthVideoVisitCalculationClient: telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.yards.v1.YardService") private readonly yardsYardClient: yardsYardServiceApi.YardServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of marketing campaigns and answers once at the end.
   */
  async batchCreateMarketingCampaigns(req: campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsRequest): Promise<campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateMarketingCampaigns", req);
    this.logger.info("batch_create_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.organizer?.displayName ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.organizer?.email ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_3 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdBy ?? "");
        break;
      default:
        selected1_3 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_4 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest.fromPartial({
      campaignBudget: {
        audit: {
          createdBy: (selected1_3 ?? ""),
          etag: (selected1_4 ?? ""),
        },
        holder: {
          displayName: (selected1_1 ?? ""),
          email: (selected1_2 ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.checkCampaignBudgetEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled(((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.participants ?? []).map(async (item) => {
      const request2 = webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest.fromPartial({
        context: req?.context,
        details: {
          contact: {
            email: (item?.contact?.email ?? ""),
            name: item?.contact?.name,
            phone: (item?.contact?.phone ?? ""),
          },
        },
      });
      const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse> =
        (input, done) => this.webhooksWebhookDeliveryValidationClient.validateWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse.fromPartial({});
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedBy ?? "") });
    return campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        message: (reply1?.outcome?.message ?? ""),
      },
    });
  }

  /**
   * Returns several marketing campaigns at once.
   */
  async batchGetMarketingCampaigns(req: campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsRequest): Promise<campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetMarketingCampaigns", req);
    this.logger.info("batch_get_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        audit: { createdAt: req?.context?.deadline },
        funding: { $case: "externalAccountId", externalAccountId: (req?.context?.actor?.userId ?? "") },
        holder: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.previewCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsResponse.fromPartial({
      marketingCampaigns: [{ organizer: { email: (reply1?.campaignBudget?.contact?.email ?? "") } }],
    });
  }

  /**
   * Creates a marketing campaign.
   */
  async cloneMarketingCampaign(req: campaignsMarketingCampaignServiceApi.CloneMarketingCampaignRequest): Promise<campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "CloneMarketingCampaign", req);
    this.logger.info("clone_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.marketingCampaign?.metadata ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        period: req?.marketingCampaign?.window,
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.marketingCampaign?.organizer?.userId ?? ""),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.countMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.marketingCampaign?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const method3 = "findMarketingCampaigns" as const;
    const invoke3: Unary<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>(invoke3, request3);
    const request4 = notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (req?.marketingCampaign?.organizer?.displayName ?? "") },
      },
      details: {
        destination: {
          lines: (req?.marketingCampaign?.location?.lines ?? []).map((value) => value),
          postalCode: (req?.marketingCampaign?.location?.postalCode ?? ""),
          recipient: (req?.marketingCampaign?.location?.recipient ?? ""),
        },
      },
    });
    const proxy4 = forwarding(this.notificationsDeliveryAttemptCalculationClient);
    const invoke4: Unary<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse> =
      (input, done) => proxy4.recalculateDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          organizer: { displayName: (reply4?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        result: { correlationId: (reply4?.deliveryAttempt?.correlationId ?? "") },
      }),
      campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          metadata: (req?.marketingCampaign?.metadata ?? {}),
          title: (req?.marketingCampaign?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Creates a marketing campaign.
   */
  async createMarketingCampaign(req: campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest): Promise<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "CreateMarketingCampaign", req);
    this.logger.info("create_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.marketingCampaign?.location?.region ?? "") },
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.suggestMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(invoke1, request1);
    const request2 = contentArticleQueryServiceApi.FindArticlesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.marketingCampaign?.location?.region ?? "") },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<contentArticleQueryServiceApi.FindArticlesRequest, contentArticleQueryServiceApi.FindArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.findArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentArticleQueryServiceApi.FindArticlesRequest, contentArticleQueryServiceApi.FindArticlesResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsRequest.fromPartial({
      context: input3?.context,
      filter: {
        createdAfter: input3?.marketingCampaign?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((input3?.marketingCampaign?.metadata ?? {}))),
        ownerId: (input3?.marketingCampaign?.organizer?.userId ?? ""),
        region: (input3?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const invoke3: Unary<campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse> =
      (input, done) => this.campaignsCampaignAssetQueryClient.suggestCampaignAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse>(invoke3, request3);
    const request4 = telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.marketingCampaign?.organizer?.email ?? "") } },
      videoVisit: {
        location: { countryCode: (req?.marketingCampaign?.location?.countryCode ?? "") },
        organizer: {
          displayName: (req?.marketingCampaign?.organizer?.displayName ?? ""),
          userId: (req?.marketingCampaign?.organizer?.userId ?? ""),
        },
      },
    });
    const cloned4: telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationRequest, telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationResponse> =
      (input, done) => this.telehealthVideoVisitCalculationClient.explainVideoVisitCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationRequest, telehealthVideoVisitCalculationServiceApi.ExplainVideoVisitCalculationResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          location: { countryCode: (reply4?.videoVisit?.location?.countryCode ?? "") },
          organizer: { displayName: (reply4?.videoVisit?.organizer?.displayName ?? "") },
        },
      }),
      campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          metadata: (req?.marketingCampaign?.metadata ?? {}),
          status: req?.marketingCampaign?.status,
        },
      }),
    );
  }

  /**
   * Deletes a marketing campaign.
   */
  async deleteMarketingCampaign(req: campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignRequest): Promise<campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse> {
    validateContext(req.context);
    if (!req.marketingCampaignId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "marketing_campaign_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteMarketingCampaign", req);
    this.logger.info("delete_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
      recommendation: {
        audit: { etag: (req?.etag ?? "") },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const decoded1 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(invoke1, decoded1);
    const request2 = webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: {
          lines: (reply1?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          locality: (reply1?.recommendation?.billingAddress?.locality ?? ""),
          postalCode: (reply1?.recommendation?.billingAddress?.postalCode ?? ""),
        } },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.LintWebhookEndpointsRequest",
      value: Buffer.from(webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.encode(request2).finish()),
    });
    const unpacked2 = webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.decode(envelope2.value);
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.lintWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.marketingCampaignId ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a marketing campaign.
   */
  async getMarketingCampaign(req: campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest): Promise<campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse> {
    validateContext(req.context);
    if (!req.marketingCampaignId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "marketing_campaign_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMarketingCampaign", req);
    this.logger.info("get_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      marketingCampaignId: (req?.marketingCampaignId ?? ""),
    });
    const client1 = this.clients.get<campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient>("acme.campaigns.v1.MarketingCampaignQueryService");
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse> =
      (input, done) => client1.summarizeMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
      },
    });
    const invoke2: Unary<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pushSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          organizer: { displayName: (reply2?.subscription?.owner?.displayName ?? "") },
        },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse.fromPartial({
        marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
      }),
    );
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async listMarketingCampaigns(req: campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest): Promise<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMarketingCampaigns", req);
    this.logger.info("list_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (req?.filter?.ownerId ?? ""),
        measurements: [{ observedAt: req?.filter?.createdAfter }],
      },
      details: {
        notify: { email: (req?.context?.actor?.email ?? "") },
        parameters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.startDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async searchMarketingCampaigns(req: campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest): Promise<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchMarketingCampaigns", req);
    this.logger.info("search_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleQueryServiceApi.ResolveArticlesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<contentArticleQueryServiceApi.ResolveArticlesRequest, contentArticleQueryServiceApi.ResolveArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.resolveArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("SearchMarketingCampaigns.ResolveArticles", () => call<contentArticleQueryServiceApi.ResolveArticlesRequest, contentArticleQueryServiceApi.ResolveArticlesResponse>(invoke1, request1));
    const request2 = contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{ children: [{ location: { region: (req?.filter?.region ?? "") } }] }],
        manager: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke2: Unary<contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest, contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.compareTaxonomyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse.fromPartial({
        marketingCampaigns: [{
          location: { postalCode: (reply2?.taxonomy?.location?.postalCode ?? "") },
        }],
      }),
    );
  }

  /**
   * Changes a marketing campaign.
   */
  async updateMarketingCampaign(req: campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignRequest): Promise<campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "UpdateMarketingCampaign", req);
    this.logger.info("update_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.CheckVenueEligibilityRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: { locality: (req?.marketingCampaign?.location?.locality ?? "") } },
        owner: { userId: (req?.marketingCampaign?.organizer?.userId ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>(
      "acme.campaigns.v1.MarketingCampaignService/UpdateMarketingCampaign:0", request1,
    );
    const request2 = campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsRequest.fromPartial({
      campaignBudget: {
        audit: { etag: (reply1?.venue?.audit?.etag ?? "") },
        holder: { email: (req?.marketingCampaign?.organizer?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsRequest, campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.lintCampaignBudgets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsRequest, campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse>(invoke2, request2));
    const request3 = yardsYardServiceApi.CreateYardRequest.fromPartial({
      context: req?.context,
      yard: {
        audit: {
          createdBy: (req?.marketingCampaign?.audit?.createdBy ?? ""),
          updatedAt: reply2?.campaignBudget?.audit?.updatedAt,
        },
        owner: { userId: (reply1?.venue?.owner?.userId ?? "") },
      },
    });
    const invoke3: Unary<yardsYardServiceApi.CreateYardRequest, yardsYardServiceApi.CreateYardResponse> =
      (input, done) => this.yardsYardClient.createYard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<yardsYardServiceApi.CreateYardResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.venue?.owner?.email ?? "") } },
    });
    const invoke4: Unary<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.explainDeliveryAttemptCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.marketingCampaign?.audit?.etag ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          location: {
            countryCode: ((reply1?.venue?.locator?.$case === "address" ? reply1?.venue?.locator.address : undefined)?.countryCode ?? ""),
          },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          participants: [{ contact: { phone: (reply2?.campaignBudget?.contact?.phone ?? "") } }],
        },
      }),
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          location: {
            region: ((reply3?.yard?.locator?.$case === "address" ? reply3?.yard?.locator.address : undefined)?.region ?? ""),
          },
        },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          organizer: { displayName: (reply4?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          title: (req?.marketingCampaign?.title ?? ""),
          window: req?.marketingCampaign?.window,
        },
      }),
    );
  }

  /**
   * Streams the changes of marketing campaigns as they happen.
   */
  async watchMarketingCampaigns(req: campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsRequest): Promise<campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchMarketingCampaigns", req);
    this.logger.info("watch_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.summarizeMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
      },
    });
    const method2 = "findAccessPolicies" as const;
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({
        marketingCampaign: {
          location: { region: (req?.filter?.region ?? "") },
          organizer: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}
