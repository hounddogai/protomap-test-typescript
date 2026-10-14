/**
 * Checks articles against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as communityModerationCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as concessionsConcessionStandQueryServiceApi from "../../../../../.cache/proto/acme/concessions/v1/concession_stand_query_service.js";
import * as contentArticleValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
import { upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toArticleRecord } from "../../data/records.js";
import { ContentRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate article operations and persist audit data.
 */
@injectable()
export class ArticleValidationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandQueryService") private readonly concessionsConcessionStandQueryClient: concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks an article.
   */
  async checkArticleEligibility(req: contentArticleValidationServiceApi.CheckArticleEligibilityRequest): Promise<contentArticleValidationServiceApi.CheckArticleEligibilityResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "CheckArticleEligibility", req);
    this.logger.info("check_article_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { displayName: (req?.article?.counterparty?.displayName ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.normalizeRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.CheckArticleEligibilityResponse.fromPartial({
        article: {
          billingAddress: {
            countryCode: (reply1?.recommendation?.billingAddress?.countryCode ?? ""),
            recipient: (reply1?.recommendation?.billingAddress?.recipient ?? ""),
          },
        },
      }),
      contentArticleValidationServiceApi.CheckArticleEligibilityResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          counterparty: req?.article?.counterparty,
        },
      }),
    );
  }

  /**
   * Explains an article.
   */
  async explainArticleDecision(req: contentArticleValidationServiceApi.ExplainArticleDecisionRequest): Promise<contentArticleValidationServiceApi.ExplainArticleDecisionResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "ExplainArticleDecision", req);
    this.logger.info("explain_article_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: { audit: { updatedAt: req?.article?.audit?.updatedAt } } },
    });
    const reply1 = await upload<featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsResponse>(
      (done) => this.featureflagsFeatureFlagClient.batchCreateFeatureFlags(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = contentContentBlockCalculationServiceApi.SimulateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdAt: input2?.article?.audit?.createdAt },
            location: { postalCode: (input2?.article?.billingAddress?.postalCode ?? "") },
          }],
        }],
      },
      context: input2?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.SimulateContentBlockRequest, contentContentBlockCalculationServiceApi.SimulateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.simulateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockCalculationServiceApi.SimulateContentBlockRequest, contentContentBlockCalculationServiceApi.SimulateContentBlockResponse>(invoke2, request2);
    const request3 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.article?.audit?.createdAt,
              etag: (reply2?.contentBlock?.audit?.etag ?? ""),
              updatedAt: reply2?.contentBlock?.audit?.updatedAt,
            },
          }],
        }],
      },
      context: req?.context,
    });
    const cloned3: contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke3, cloned3);
    const request4 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: {
              lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const decoded4 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.toJSON(request4))),
    );
    const invoke4: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.ExplainArticleDecisionResponse.fromPartial({
        article: {
          billingAddress: { postalCode: (reply2?.contentBlock?.location?.postalCode ?? "") },
        },
      }),
      contentArticleValidationServiceApi.ExplainArticleDecisionResponse.fromPartial({
        article: { audit: { createdAt: reply3?.contentBlock?.audit?.createdAt } },
      }),
      contentArticleValidationServiceApi.ExplainArticleDecisionResponse.fromPartial({
        article: { audit: { createdAt: reply4?.contentBlock?.audit?.createdAt } },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      contentArticleValidationServiceApi.ExplainArticleDecisionResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          metadata: (req?.article?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Returns an article.
   */
  async getArticleRules(req: contentArticleValidationServiceApi.GetArticleRulesRequest): Promise<contentArticleValidationServiceApi.GetArticleRulesResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetArticleRules", req);
    this.logger.info("get_article_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            manager: {
              email: (req?.context?.actor?.email ?? ""),
              userId: (req?.context?.actor?.userId ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.CompareContentBlockOptionsRequest",
      value: Buffer.from(contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.encode(request1).finish()),
    });
    const unpacked1 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.decode(envelope1.value);
    const invoke1: Unary<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> =
      (input, done) => this.contentContentBlockCalculationClient.compareContentBlockOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>(invoke1, unpacked1);
    const request2 = communityModerationCalculationServiceApi.QuoteModerationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: (reply1?.contentBlock?.location?.recipient ?? ""),
          region: (reply1?.contentBlock?.location?.region ?? ""),
        },
      },
      moderation: {
        assignee: { userId: (reply1?.contentBlock?.manager?.userId ?? "") },
        origin: { $case: "customer", customer: { email: (reply1?.contentBlock?.manager?.email ?? "") } },
      },
    });
    const client2 = this.clients.get<communityModerationCalculationServiceApi.ModerationCalculationServiceClient>("acme.community.v1.ModerationCalculationService");
    const invoke2: Unary<communityModerationCalculationServiceApi.QuoteModerationRequest, communityModerationCalculationServiceApi.QuoteModerationResponse> =
      (input, done) => client2.quoteModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationCalculationServiceApi.QuoteModerationRequest, communityModerationCalculationServiceApi.QuoteModerationResponse>(invoke2, request2);
    return mergeResponses(
      contentArticleValidationServiceApi.GetArticleRulesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      contentArticleValidationServiceApi.GetArticleRulesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      contentArticleValidationServiceApi.GetArticleRulesResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } }),
    );
  }

  /**
   * Lints an article.
   */
  async lintArticles(req: contentArticleValidationServiceApi.LintArticlesRequest): Promise<contentArticleValidationServiceApi.LintArticlesResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "LintArticles", req);
    this.logger.info("lint_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.article?.lines ?? []).map(async (item) => {
      const request1 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
              location: { locality: (req?.article?.billingAddress?.locality ?? "") },
            }],
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
        (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? contentContentBlockCalculationServiceApi.EstimateContentBlockResponse.fromPartial({});
    const settled2 = await Promise.allSettled((req?.article?.lines ?? []).map(async (item) => {
      const request2 = notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.fromPartial({
        context: req?.context,
        subscription: {
          action: { $case: "discount", discount: { amount: item?.tax?.amount } },
        },
      });
      const invoke2: Unary<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse> =
        (input, done) => this.notificationsSubscriptionApprovalClient.recallSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentArticleValidationServiceApi.LintArticlesResponse.fromPartial({
      article: {
        articleId: (req?.articleId ?? ""),
        notes: (req?.article?.notes ?? ""),
      },
    });
  }

  /**
   * Normalizes an article.
   */
  async normalizeArticle(req: contentArticleValidationServiceApi.NormalizeArticleRequest): Promise<contentArticleValidationServiceApi.NormalizeArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "NormalizeArticle", req);
    this.logger.info("normalize_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityCalculationServiceApi.EstimateAffinityRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
          locality: (req?.article?.billingAddress?.locality ?? ""),
          region: (req?.article?.billingAddress?.region ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.estimateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{ location: { region: (req?.article?.billingAddress?.region ?? "") } }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.calculateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>(invoke2, request2));
    const request3 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdBy: (req?.article?.audit?.createdBy ?? "") },
            location: {
              lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
            },
            manager: {
              displayName: (reply2?.contentBlock?.manager?.displayName ?? ""),
              email: (req?.details?.contact?.email ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke3: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("NormalizeArticle.ExplainContentBlockCalculation", () => call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.NormalizeArticleResponse.fromPartial({
        article: {
          number: (reply1?.affinity?.subject?.number ?? ""),
          total: reply1?.breakdown?.total,
        },
      }),
      contentArticleValidationServiceApi.NormalizeArticleResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      contentArticleValidationServiceApi.NormalizeArticleResponse.fromPartial({
        article: { audit: { updatedAt: reply3?.contentBlock?.audit?.updatedAt } },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      contentArticleValidationServiceApi.NormalizeArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          dueAt: req?.article?.dueAt,
        },
      }),
    );
  }

  /**
   * Previews an article.
   */
  async previewArticle(req: contentArticleValidationServiceApi.PreviewArticleRequest): Promise<contentArticleValidationServiceApi.PreviewArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "PreviewArticle", req);
    this.logger.info("preview_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionQueryServiceApi.BrowseRenditionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.article?.audit?.createdAt,
        ownerId: (req?.article?.counterparty?.contentRevisionId ?? ""),
        region: (req?.article?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<mediaRenditionQueryServiceApi.BrowseRenditionsRequest, mediaRenditionQueryServiceApi.BrowseRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.browseRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.PreviewArticleResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      contentArticleValidationServiceApi.PreviewArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          dueAt: req?.article?.dueAt,
        },
      }),
    );
  }

  /**
   * Scores an article.
   */
  async scoreArticle(req: contentArticleValidationServiceApi.ScoreArticleRequest): Promise<contentArticleValidationServiceApi.ScoreArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "ScoreArticle", req);
    this.logger.info("score_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>> = [];
    for (const item of (req?.article?.lines ?? [])) {
      tasks1.push(async () => {
        const request1 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.fromPartial({
          contentBlock: {
            children: [{
              children: [{
                attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
                location: { recipient: (req?.details?.destination?.recipient ?? "") },
              }],
            }],
          },
          context: req?.context,
        });
        const invoke1: Unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> =
          (input, done) => this.contentContentBlockCalculationClient.calculateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? contentContentBlockCalculationServiceApi.CalculateContentBlockResponse.fromPartial({});
    const request2 = concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const reply2 = await this.workQueue.enqueue<concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsRequest, concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsResponse>(
      "acme.content.v1.ArticleValidationService/ScoreArticle:1", request2,
    );
    const request3 = auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.contentBlock?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.article?.metadata ?? {}))),
        ownerId: (reply1?.contentBlock?.contentBlockId ?? ""),
        region: (req?.article?.billingAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.browseAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.ScoreArticleResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      contentArticleValidationServiceApi.ScoreArticleResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      contentArticleValidationServiceApi.ScoreArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          metadata: (req?.article?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Validates an article.
   */
  async validateArticle(req: contentArticleValidationServiceApi.ValidateArticleRequest): Promise<contentArticleValidationServiceApi.ValidateArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "ValidateArticle", req);
    this.logger.info("validate_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: { owner: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.approveSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsSubscriptionApprovalServiceApi.ApproveSubscriptionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              createdBy: (req?.article?.audit?.createdBy ?? ""),
              updatedAt: reply1?.subscription?.audit?.updatedAt,
              updatedBy: (reply1?.subscription?.audit?.updatedBy ?? ""),
            },
            manager: { displayName: (req?.article?.counterparty?.displayName ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> =
      (input, done) => this.contentContentBlockCalculationClient.compareContentBlockOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleValidationServiceApi.ValidateArticleResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      contentArticleValidationServiceApi.ValidateArticleResponse.fromPartial({
        article: {
          audit: {
            createdAt: reply2?.contentBlock?.audit?.createdAt,
            updatedAt: reply2?.contentBlock?.audit?.updatedAt,
          },
        },
      }),
      contentArticleValidationServiceApi.ValidateArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          notes: (req?.article?.notes ?? ""),
        },
      }),
    );
  }
}
