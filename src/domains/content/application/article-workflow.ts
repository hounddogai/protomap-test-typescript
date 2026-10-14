/**
 * Runs the long-lived workflow that takes an article from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as contentArticleWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as pricingPriceListServiceApi from "../../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toArticleRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate article operations and persist audit data.
 */
@injectable()
export class ArticleWorkflowWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockQueryService") private readonly contentContentBlockQueryClient: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobApprovalService") private readonly mediaTranscodeJobApprovalClient: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.pricing.v1.PriceListService") private readonly pricingPriceListClient: pricingPriceListServiceApi.PriceListServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionWorkflowService") private readonly surveysQuestionWorkflowClient: surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an article.
   */
  async advanceArticleWorkflow(req: contentArticleWorkflowServiceApi.AdvanceArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.AdvanceArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "AdvanceArticleWorkflow", req);
    this.logger.info("advance_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { email: (req?.details?.notify?.email ?? "") },
        requester: {
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobApprovalClient.rejectTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.AdvanceArticleWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      contentArticleWorkflowServiceApi.AdvanceArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          number: (req?.article?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels an article.
   */
  async cancelArticleWorkflow(req: contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "CancelArticleWorkflow", req);
    this.logger.info("cancel_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const method1 = "summarizeContentBlocks" as const;
    const invoke1: Unary<contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest, contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse> =
      (input, done) => this.contentContentBlockQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest, contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          total: req?.article?.total,
        },
      }),
    );
  }

  /**
   * Returns an article.
   */
  async inspectArticleWorkflow(req: contentArticleWorkflowServiceApi.InspectArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.InspectArticleWorkflowResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectArticleWorkflow", req);
    this.logger.info("inspect_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      consentRecord: {
        correlationId: (req?.context?.actor?.userId ?? ""),
        occurredAt: req?.context?.deadline,
        source: (req?.articleId ?? ""),
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.customersConsentRecordCalculationClient);
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => proxy1.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse>(invoke1, request1);
    return mergeResponses(
      contentArticleWorkflowServiceApi.InspectArticleWorkflowResponse.fromPartial({
        article: { counterparty: { kind: (reply1?.consentRecord?.kind ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      contentArticleWorkflowServiceApi.InspectArticleWorkflowResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } }),
    );
  }

  /**
   * Lists articles a page at a time.
   */
  async listArticleWorkflows(req: contentArticleWorkflowServiceApi.ListArticleWorkflowsRequest): Promise<contentArticleWorkflowServiceApi.ListArticleWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListArticleWorkflows", req);
    this.logger.info("list_article_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantSyncServiceApi.StreamVariantChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream1 = this.experimentsVariantSyncClient.streamVariantChanges(metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const reading1 = collect(stream1);
    const writing1 = (async () => {
      await write(stream1, request1);
      stream1.end();
    })();
    const [messages1] = await Promise.all([reading1, writing1]);
    const reply1 = messages1.at(-1) ?? experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentArticleWorkflowServiceApi.ListArticleWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses an article.
   */
  async pauseArticleWorkflow(req: contentArticleWorkflowServiceApi.PauseArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "PauseArticleWorkflow", req);
    this.logger.info("pause_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerServiceApi.WatchCustomersRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.article?.billingAddress?.region ?? "") },
      subscriber: {
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
      },
    });
    const stream1 = this.customersCustomerClient.watchCustomers(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? customersCustomerServiceApi.WatchCustomersResponse.fromPartial({});
    const request2 = pricingPriceListServiceApi.ClonePriceListRequest.fromPartial({
      context: req?.context,
      priceList: { audit: { etag: (req?.article?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<pricingPriceListServiceApi.ClonePriceListRequest, pricingPriceListServiceApi.ClonePriceListResponse> =
      (input, done) => this.pricingPriceListClient.clonePriceList(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<pricingPriceListServiceApi.ClonePriceListRequest, pricingPriceListServiceApi.ClonePriceListResponse>(invoke2, request2);
    const request3 = auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest.fromPartial({
      auditEvent: {
        subject: { displayName: (reply2?.priceList?.owner?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse> =
      (input, done) => this.auditAuditEventValidationClient.explainAuditEventDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse.fromPartial({ article: { audit: { etag: (reply2?.priceList?.audit?.etag ?? "") } } }),
      contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse.fromPartial({
        article: {
          counterparty: { displayName: (reply3?.auditEvent?.subject?.displayName ?? "") },
        },
      }),
      contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          status: req?.article?.status,
        },
      }),
    );
  }

  /**
   * Resumes an article.
   */
  async resumeArticleWorkflow(req: contentArticleWorkflowServiceApi.ResumeArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "ResumeArticleWorkflow", req);
    this.logger.info("resume_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentContentRevisionValidationServiceApi.LintContentRevisionsRequest.fromPartial({
      context: input1?.context,
      details: { contact: { phone: (input1?.details?.notify?.phone ?? "") } },
    });
    const invoke1: Unary<contentContentRevisionValidationServiceApi.LintContentRevisionsRequest, contentContentRevisionValidationServiceApi.LintContentRevisionsResponse> =
      (input, done) => this.contentContentRevisionValidationClient.lintContentRevisions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionValidationServiceApi.LintContentRevisionsRequest, contentContentRevisionValidationServiceApi.LintContentRevisionsResponse>(invoke1, request1);
    const request2 = contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: { updatedBy: (req?.article?.audit?.updatedBy ?? "") },
            location: {
              locality: (req?.article?.billingAddress?.locality ?? ""),
              recipient: (req?.article?.billingAddress?.recipient ?? ""),
            },
            manager: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
          }],
        }],
      },
    });
    const cloned2: contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest, contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse> =
      (input, done) => this.contentTaxonomyValidationClient.validateTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest, contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse>(invoke2, cloned2);
    const request3 = contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.article?.audit?.createdAt,
              updatedBy: (req?.article?.audit?.updatedBy ?? ""),
            },
            location: { postalCode: (reply2?.taxonomy?.location?.postalCode ?? "") },
            manager: { userId: (reply2?.taxonomy?.manager?.userId ?? "") },
          }],
        }],
      },
    });
    const decoded3 = contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest.fromJSON(
      JSON.parse(JSON.stringify(contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest.toJSON(request3))),
    );
    const invoke3: Unary<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse> =
      (input, done) => this.contentTaxonomyValidationClient.scoreTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse.fromPartial({
        article: { audit: { updatedBy: (reply2?.taxonomy?.audit?.updatedBy ?? "") } },
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
      }),
      contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse.fromPartial({
        article: { audit: { updatedBy: (reply3?.taxonomy?.audit?.updatedBy ?? "") } },
        outcome: { message: (reply3?.result?.message ?? "") },
      }),
      contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          status: req?.article?.status,
        },
      }),
    );
  }

  /**
   * Retrys an article.
   */
  async retryArticleWorkflow(req: contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "RetryArticleWorkflow", req);
    this.logger.info("retry_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest.fromPartial({
      contentRevisionId: (req?.article?.counterparty?.contentRevisionId ?? ""),
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.GetContentRevisionRulesRequest",
      value: Buffer.from(contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest.encode(request1).finish()),
    });
    const unpacked1 = contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest.decode(envelope1.value);
    const invoke1: Unary<contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest, contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse> =
      (input, done) => this.contentContentRevisionValidationClient.getContentRevisionRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest, contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse>(invoke1, unpacked1);
    const request2 = contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          audit: { updatedBy: (req?.article?.audit?.updatedBy ?? "") },
          children: [{
            manager: {
              displayName: (reply1?.contentRevision?.subject?.displayName ?? ""),
              email: (reply1?.contentRevision?.subject?.email ?? ""),
            },
          }],
        }],
      },
    });
    const client2 = this.clients.get<contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient>("acme.content.v1.TaxonomyCalculationService");
    const invoke2: Unary<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse> =
      (input, done) => client2.simulateTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse>(invoke2, request2);
    const results3 = await Promise.all((req?.article?.lines ?? []).map(async (item) => {
      const request3 = customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.fromPartial({
        context: req?.context,
        customerSegment: { action: { $case: "discount", discount: { amount: item?.amount } } },
      });
      const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse> =
        (input, done) => this.customersCustomerSegmentCalculationClient.recalculateCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse.fromPartial({
        article: {
          counterparty: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
        },
      }),
      contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse.fromPartial({
        article: {
          billingAddress: { locality: (reply2?.taxonomy?.location?.locality ?? "") },
        },
      }),
      contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          dueAt: req?.article?.dueAt,
        },
      }),
    );
  }

  /**
   * Signals an article.
   */
  async signalArticleWorkflow(req: contentArticleWorkflowServiceApi.SignalArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "SignalArticleWorkflow", req);
    this.logger.info("signal_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: { owner: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke1: Unary<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.normalizeMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.article?.dueAt,
        region: ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest, surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse> =
      (input, done) => this.surveysQuestionWorkflowClient.listQuestionWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest, surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse.fromPartial({
        article: { audit: { etag: (reply1?.metricSeries?.audit?.etag ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          notes: (req?.article?.notes ?? ""),
        },
      }),
    );
  }

  /**
   * Starts an article.
   */
  async startArticleWorkflow(req: contentArticleWorkflowServiceApi.StartArticleWorkflowRequest): Promise<contentArticleWorkflowServiceApi.StartArticleWorkflowResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "StartArticleWorkflow", req);
    this.logger.info("start_article_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.article?.billingAddress?.postalCode ?? ""),
          region: (req?.article?.billingAddress?.region ?? ""),
        },
      },
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse> =
      (input, done) => this.customersPreferenceCalculationClient.comparePreferenceOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("StartArticleWorkflow.ComparePreferenceOptions", () => call<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse>(invoke1, request1));
    const request2 = contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: { createdBy: (reply1?.preference?.audit?.createdBy ?? "") },
            manager: { displayName: (reply1?.preference?.owner?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse> =
      (input, done) => this.contentTaxonomyValidationClient.scoreTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleWorkflowServiceApi.StartArticleWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentArticleWorkflowServiceApi.StartArticleWorkflowResponse.fromPartial({ article: { total: reply2?.breakdown?.total } }),
      contentArticleWorkflowServiceApi.StartArticleWorkflowResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          metadata: (req?.article?.metadata ?? {}),
        },
      }),
    );
  }
}
