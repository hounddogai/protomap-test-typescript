/**
 * Manages articles: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as contentArticleServiceApi from "../../../../.cache/proto/acme/content/v1/article_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
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
import { toArticleRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate article operations and persist audit data.
 */
@injectable()
export class ArticleWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of articles and answers once at the end.
   */
  async batchCreateArticles(req: contentArticleServiceApi.BatchCreateArticlesRequest): Promise<contentArticleServiceApi.BatchCreateArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateArticles", req);
    this.logger.info("batch_create_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionValidationServiceApi.LintContentRevisionsRequest.fromPartial({
      contentRevision: {
        source: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.source ?? ""),
        subject: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          phone: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<contentContentRevisionValidationServiceApi.LintContentRevisionsRequest, contentContentRevisionValidationServiceApi.LintContentRevisionsResponse> =
      (input, done) => this.contentContentRevisionValidationClient.lintContentRevisions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<contentContentRevisionValidationServiceApi.LintContentRevisionsRequest, contentContentRevisionValidationServiceApi.LintContentRevisionsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const settled2 = await Promise.allSettled(((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.lines ?? []).map(async (item) => {
      const request2 = auditAuditEventServiceApi.ListAuditEventsRequest.fromPartial({
        context: req?.context,
        filter: {
          labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          ownerId: (item?.lineId ?? ""),
          region: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.billingAddress?.region ?? ""),
        },
      });
      const invoke2: Unary<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse> =
        (input, done) => this.auditAuditEventClient.listAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: auditAuditEventServiceApi.ListAuditEventsResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? auditAuditEventServiceApi.ListAuditEventsResponse.fromPartial({});
    const request3 = formsFormFieldValidationServiceApi.PreviewFormFieldRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
        },
      },
      formField: {
        audit: {
          updatedBy: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedBy ?? ""),
        },
        owner: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<formsFormFieldValidationServiceApi.PreviewFormFieldRequest, formsFormFieldValidationServiceApi.PreviewFormFieldResponse> =
      (input, done) => this.formsFormFieldValidationClient.previewFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<formsFormFieldValidationServiceApi.PreviewFormFieldRequest, formsFormFieldValidationServiceApi.PreviewFormFieldResponse>(invoke3, request3));
    const request4 = personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest.fromPartial({
      affinity: {
        subject: { displayName: (reply3?.formField?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke4: Unary<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.checkAffinityEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("BatchCreateArticles.CheckAffinityEligibility", () => call<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      contentArticleServiceApi.BatchCreateArticlesResponse.fromPartial({
        rejections: [{ sequence: (reply1?.contentRevision?.sequence ?? 0) }],
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      contentArticleServiceApi.BatchCreateArticlesResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      contentArticleServiceApi.BatchCreateArticlesResponse.fromPartial({ result: { correlationId: (reply4?.affinity?.correlationId ?? "") } }),
    );
  }

  /**
   * Returns several articles at once.
   */
  async batchGetArticles(req: contentArticleServiceApi.BatchGetArticlesRequest): Promise<contentArticleServiceApi.BatchGetArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetArticles", req);
    this.logger.info("batch_get_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockValidationServiceApi.ScoreContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
            audit: { createdAt: req?.context?.deadline },
          }],
          manager: {
            email: (req?.context?.actor?.email ?? ""),
            userId: (req?.context?.actor?.userId ?? ""),
          },
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockValidationServiceApi.ScoreContentBlockRequest, contentContentBlockValidationServiceApi.ScoreContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.scoreContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.contentBlock?.location?.lines ?? []).map((value) => value),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(
      "acme.content.v1.ArticleService/BatchGetArticles:1", request2,
    );
    return mergeResponses(
      contentArticleServiceApi.BatchGetArticlesResponse.fromPartial({
        articles: [{
          billingAddress: { postalCode: (reply1?.contentBlock?.location?.postalCode ?? "") },
          total: reply1?.breakdown?.total,
        }],
      }),
      contentArticleServiceApi.BatchGetArticlesResponse.fromPartial({
        articles: [{
          audit: {
            createdBy: (reply2?.webhookSecret?.audit?.createdBy ?? ""),
            updatedAt: reply2?.webhookSecret?.audit?.updatedAt,
          },
        }],
      }),
    );
  }

  /**
   * Creates an article.
   */
  async createArticle(req: contentArticleServiceApi.CreateArticleRequest): Promise<contentArticleServiceApi.CreateArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "CreateArticle", req);
    this.logger.info("create_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>> = [];
    for (const item of (req?.article?.lines ?? [])) {
      tasks1.push(async () => {
        const request1 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
          contentBlock: {
            children: [{
              attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
              children: [{
                location: { countryCode: (req?.article?.billingAddress?.countryCode ?? "") },
              }],
            }],
          },
          context: req?.context,
        });
        const invoke1: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
          (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse.fromPartial({});
    const request2 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdBy: (reply1?.contentBlock?.audit?.createdBy ?? "") },
            location: {
              lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
            },
            manager: { userId: (reply1?.contentBlock?.manager?.userId ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.calculateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      contentArticleServiceApi.CreateArticleResponse.fromPartial({
        article: {
          billingAddress: { lines: (reply2?.contentBlock?.location?.lines ?? []) },
        },
      }),
      contentArticleServiceApi.CreateArticleResponse.fromPartial({
        article: {
          articleId: (req?.article?.articleId ?? ""),
          total: req?.article?.total,
        },
      }),
    );
  }

  /**
   * Deletes an article.
   */
  async deleteArticle(req: contentArticleServiceApi.DeleteArticleRequest): Promise<contentArticleServiceApi.DeleteArticleResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteArticle", req);
    this.logger.info("delete_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      taxonomy: {
        children: [{
          children: [{
            audit: { etag: (req?.etag ?? "") },
            manager: {
              email: (req?.context?.actor?.email ?? ""),
              userId: (req?.context?.actor?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.explainTaxonomyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentArticleServiceApi.DeleteArticleResponse.fromPartial({
      effectiveAt: reply1?.outcome?.effectiveAt,
      result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
    });
  }

  /**
   * Returns an article.
   */
  async getArticle(req: contentArticleServiceApi.GetArticleRequest): Promise<contentArticleServiceApi.GetArticleResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetArticle", req);
    this.logger.info("get_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{ manager: { userId: (req?.context?.actor?.userId ?? "") } }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.simulateTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      contentArticleServiceApi.GetArticleResponse.fromPartial({
        article: {
          audit: { createdAt: reply1?.taxonomy?.audit?.createdAt },
          billingAddress: { lines: (reply1?.taxonomy?.location?.lines ?? []) },
        },
      }),
      contentArticleServiceApi.GetArticleResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } }),
    );
  }

  /**
   * Lists articles a page at a time.
   */
  async listArticles(req: contentArticleServiceApi.ListArticlesRequest): Promise<contentArticleServiceApi.ListArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListArticles", req);
    this.logger.info("list_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleQueryServiceApi.FindArticlesRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        statuses: (req?.filter?.statuses ?? []).map((value) => value),
      },
    });
    const invoke1: Unary<contentArticleQueryServiceApi.FindArticlesRequest, contentArticleQueryServiceApi.FindArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.findArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleServiceApi.ListArticlesResponse.fromPartial({
      result: {
        referenceIds: (reply1?.result?.referenceIds ?? []),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Lists articles a page at a time.
   */
  async searchArticles(req: contentArticleServiceApi.SearchArticlesRequest): Promise<contentArticleServiceApi.SearchArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchArticles", req);
    this.logger.info("search_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleServiceApi.SearchArticlesResponse.fromPartial({});
  }

  /**
   * Changes an article.
   */
  async updateArticle(req: contentArticleServiceApi.UpdateArticleRequest): Promise<contentArticleServiceApi.UpdateArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "UpdateArticle", req);
    this.logger.info("update_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.NormalizeFormFieldRequest.fromPartial({
      context: req?.context,
      formField: { audit: { createdBy: (req?.article?.audit?.createdBy ?? "") } },
    });
    const method1 = "normalizeFormField" as const;
    const invoke1: Unary<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse> =
      (input, done) => this.formsFormFieldValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse>(invoke1, request1);
    const request2 = venuesVenueQueryServiceApi.FindVenuesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.article?.billingAddress?.region ?? "") },
    });
    const proxy2 = forwarding(this.venuesVenueQueryClient);
    const invoke2: Unary<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse> =
      (input, done) => proxy2.findVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.article?.audit?.etag ?? "") });
    return mergeResponses(
      contentArticleServiceApi.UpdateArticleResponse.fromPartial({ article: { audit: { etag: (reply1?.formField?.audit?.etag ?? "") } } }),
      contentArticleServiceApi.UpdateArticleResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      contentArticleServiceApi.UpdateArticleResponse.fromPartial({
        article: {
          billingAddress: req?.article?.billingAddress,
          metadata: (req?.article?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Streams the changes of articles as they happen.
   */
  async watchArticles(req: contentArticleServiceApi.WatchArticlesRequest): Promise<contentArticleServiceApi.WatchArticlesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchArticles", req);
    this.logger.info("watch_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.subscriber?.phone ?? "") } },
      webhookSecret: {
        contact: {
          email: (req?.subscriber?.email ?? ""),
          name: req?.subscriber?.name,
        },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest, webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.explainWebhookSecretDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest, webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      contentArticleServiceApi.WatchArticlesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      contentArticleServiceApi.WatchArticlesResponse.fromPartial({ article: { billingAddress: { region: (req?.filter?.region ?? "") } } }),
    );
  }
}

/**
 * The gRPC boundary for ArticleService; workflows own validation and database transactions.
 */
@injectable()
export class ArticleHandler {
  constructor(@inject(ArticleWorkflow) private readonly workflow: ArticleWorkflow) {}

  /**
   * Takes a stream of articles and answers once at the end.
   */
  batchCreateArticles = clientStream<contentArticleServiceApi.BatchCreateArticlesRequest, contentArticleServiceApi.BatchCreateArticlesResponse>(
    (request) => this.workflow.batchCreateArticles(request), () => contentArticleServiceApi.BatchCreateArticlesResponse.fromPartial({}),
  );

  /**
   * Returns several articles at once.
   */
  batchGetArticles = unary<contentArticleServiceApi.BatchGetArticlesRequest, contentArticleServiceApi.BatchGetArticlesResponse>(
    (request) => this.workflow.batchGetArticles(request),
  );

  /**
   * Creates an article.
   */
  createArticle = (call: ServerUnaryCall<contentArticleServiceApi.CreateArticleRequest, contentArticleServiceApi.CreateArticleResponse>, done: sendUnaryData<contentArticleServiceApi.CreateArticleResponse>): void => {
    void this.workflow.createArticle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes an article.
   */
  deleteArticle = unary<contentArticleServiceApi.DeleteArticleRequest, contentArticleServiceApi.DeleteArticleResponse>(
    (request) => this.workflow.deleteArticle(request),
  );

  /**
   * Returns an article.
   */
  getArticle = unary<contentArticleServiceApi.GetArticleRequest, contentArticleServiceApi.GetArticleResponse>(
    (request) => this.workflow.getArticle(request),
  );

  /**
   * Lists articles a page at a time.
   */
  listArticles = (call: ServerUnaryCall<contentArticleServiceApi.ListArticlesRequest, contentArticleServiceApi.ListArticlesResponse>, done: sendUnaryData<contentArticleServiceApi.ListArticlesResponse>): void => {
    void this.workflow.listArticles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists articles a page at a time.
   */
  searchArticles = unary<contentArticleServiceApi.SearchArticlesRequest, contentArticleServiceApi.SearchArticlesResponse>(
    (request) => this.workflow.searchArticles(request),
  );

  /**
   * Changes an article.
   */
  updateArticle = unary<contentArticleServiceApi.UpdateArticleRequest, contentArticleServiceApi.UpdateArticleResponse>(
    (request) => this.workflow.updateArticle(request),
  );

  /**
   * Streams the changes of articles as they happen.
   */
  watchArticles = serverStream<contentArticleServiceApi.WatchArticlesRequest, contentArticleServiceApi.WatchArticlesResponse>(
    (request) => this.workflow.watchArticles(request),
  );
}

export function implementation(handler: ArticleHandler): contentArticleServiceApi.ArticleServiceServer {
  return {
    batchCreateArticles: handler.batchCreateArticles,
    batchGetArticles: handler.batchGetArticles,
    createArticle: handler.createArticle,
    deleteArticle: handler.deleteArticle,
    getArticle: handler.getArticle,
    listArticles: handler.listArticles,
    searchArticles: handler.searchArticles,
    updateArticle: handler.updateArticle,
    watchArticles: handler.watchArticles,
  };
}
