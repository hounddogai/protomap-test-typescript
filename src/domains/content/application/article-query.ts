/**
 * Answers read-only questions about articles, for screens and reports. Remote work stays behind typed client ports.
 */

import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate article operations and persist audit data.
 */
@injectable()
export class ArticleQueryWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists articles a page at a time.
   */
  async browseArticles(req: contentArticleQueryServiceApi.BrowseArticlesRequest): Promise<contentArticleQueryServiceApi.BrowseArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseArticles", req);
    this.logger.info("browse_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.PreviewExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { updatedAt: req?.filter?.createdAfter },
        location: { region: (req?.filter?.region ?? "") },
        organizer: { userId: (req?.context?.actor?.userId ?? "") },
        participants: [{ contact: { email: (req?.context?.actor?.email ?? "") } }],
      },
    });
    const method1 = "previewExperiment" as const;
    const invoke1: Unary<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleQueryServiceApi.BrowseArticlesResponse.fromPartial({
      articles: [{ audit: { updatedBy: (reply1?.experiment?.audit?.updatedBy ?? "") } }],
    });
  }

  /**
   * Counts articles by status.
   */
  async countArticles(req: contentArticleQueryServiceApi.CountArticlesRequest): Promise<contentArticleQueryServiceApi.CountArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountArticles", req);
    this.logger.info("count_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      contentRevision: {
        measurements: [{ observedAt: req?.filter?.createdAfter }],
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const proxy1 = forwarding(this.contentContentRevisionCalculationClient);
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse> =
      (input, done) => proxy1.calculateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleQueryServiceApi.CountArticlesResponse.fromPartial({
      result: {
        correlationId: (reply1?.contentRevision?.correlationId ?? ""),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Streams every matching article.
   */
  async exportArticles(req: contentArticleQueryServiceApi.ExportArticlesRequest): Promise<contentArticleQueryServiceApi.ExportArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportArticles", req);
    this.logger.info("export_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{ children: [{ location: { region: (req?.filter?.region ?? "") } }] }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke1, request1);
    const request2 = contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (reply1?.contentBlock?.location?.locality ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest, contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.estimateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest, contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      contentArticleQueryServiceApi.ExportArticlesResponse.fromPartial({
        article: {
          counterparty: { displayName: (reply1?.contentBlock?.manager?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      contentArticleQueryServiceApi.ExportArticlesResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      contentArticleQueryServiceApi.ExportArticlesResponse.fromPartial({ article: { billingAddress: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Lists articles a page at a time.
   */
  async findArticles(req: contentArticleQueryServiceApi.FindArticlesRequest): Promise<contentArticleQueryServiceApi.FindArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindArticles", req);
    this.logger.info("find_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleQueryServiceApi.FindArticlesResponse.fromPartial({});
  }

  /**
   * Returns an article.
   */
  async lookupArticle(req: contentArticleQueryServiceApi.LookupArticleRequest): Promise<contentArticleQueryServiceApi.LookupArticleResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupArticle", req);
    this.logger.info("lookup_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest.fromPartial({
      context: input1?.context,
      taxonomy: {
        children: [{
          children: [{
            manager: {
              email: (input1?.context?.actor?.email ?? ""),
              userId: (input1?.context?.actor?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse> =
      (input, done) => this.contentTaxonomyValidationClient.checkTaxonomyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse>(invoke1, request1);
    return mergeResponses(
      contentArticleQueryServiceApi.LookupArticleResponse.fromPartial({ article: { audit: { etag: (reply1?.taxonomy?.audit?.etag ?? "") } } }),
      contentArticleQueryServiceApi.LookupArticleResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } }),
    );
  }

  /**
   * Returns an article.
   */
  async peekArticle(req: contentArticleQueryServiceApi.PeekArticleRequest): Promise<contentArticleQueryServiceApi.PeekArticleResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekArticle", req);
    this.logger.info("peek_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    return contentArticleQueryServiceApi.PeekArticleResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } });
  }

  /**
   * Returns several articles at once.
   */
  async resolveArticles(req: contentArticleQueryServiceApi.ResolveArticlesRequest): Promise<contentArticleQueryServiceApi.ResolveArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveArticles", req);
    this.logger.info("resolve_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.LintSearchIndexesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      searchIndex: {
        owner: { userId: (req?.context?.actor?.userId ?? "") },
        tags: (req?.articleIds ?? []).map((value) => value),
      },
    });
    const cloned1: searchSearchIndexValidationServiceApi.LintSearchIndexesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexValidationClient.lintSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse>(invoke1, cloned1);
    const request2 = identityUserQueryServiceApi.PeekUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.context?.actor?.userId ?? ""),
    });
    const decoded2 = identityUserQueryServiceApi.PeekUserRequest.fromJSON(
      JSON.parse(JSON.stringify(identityUserQueryServiceApi.PeekUserRequest.toJSON(request2))),
    );
    const invoke2: Unary<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse> =
      (input, done) => this.identityUserQueryClient.peekUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse>(invoke2, decoded2);
    return mergeResponses(
      contentArticleQueryServiceApi.ResolveArticlesResponse.fromPartial({
        articles: [{
          billingAddress: {
            recipient: ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.recipient ?? ""),
          },
        }],
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      contentArticleQueryServiceApi.ResolveArticlesResponse.fromPartial({
        articles: [{
          billingAddress: { lines: (reply2?.user?.primaryAddress?.lines ?? []) },
        }],
      }),
    );
  }

  /**
   * Lists articles a page at a time.
   */
  async suggestArticles(req: contentArticleQueryServiceApi.SuggestArticlesRequest): Promise<contentArticleQueryServiceApi.SuggestArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestArticles", req);
    this.logger.info("suggest_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: req?.filter?.createdAfter,
          updatedAt: req?.context?.deadline,
        },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.SubmitSubscriptionRequest",
      value: Buffer.from(notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.submitSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleQueryServiceApi.SuggestArticlesResponse.fromPartial({
      articles: [{
        lines: [{
          amount: (reply1?.subscription?.action?.$case === "discount" ? reply1?.subscription?.action.discount : undefined)?.amount,
          tax: {
            amount: (reply1?.subscription?.action?.$case === "discount" ? reply1?.subscription?.action.discount : undefined)?.amount,
          },
        }],
      }],
    });
  }

  /**
   * Summarizes an article.
   */
  async summarizeArticles(req: contentArticleQueryServiceApi.SummarizeArticlesRequest): Promise<contentArticleQueryServiceApi.SummarizeArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeArticles", req);
    this.logger.info("summarize_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotValidationServiceApi.ValidateChatBotRequest.fromPartial({
      chatBot: { action: { $case: "block", block: { reason: (req?.reason ?? "") } } },
      context: req?.context,
    });
    const client1 = this.clients.get<chatChatBotValidationServiceApi.ChatBotValidationServiceClient>("acme.chat.v1.ChatBotValidationService");
    const invoke1: Unary<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse> =
      (input, done) => client1.validateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      contentArticleQueryServiceApi.SummarizeArticlesResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      contentArticleQueryServiceApi.SummarizeArticlesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
