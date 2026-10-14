/**
 * Routes articles through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as bankingBankAccountServiceApi from "../../../../../.cache/proto/acme/banking/v1/bank_account_service.js";
import * as contentArticleApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as formsFormWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
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
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate article operations and persist audit data.
 */
@injectable()
export class ArticleApprovalWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.banking.v1.BankAccountService") private readonly bankingBankAccountClient: bankingBankAccountServiceApi.BankAccountServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionWorkflowService") private readonly formsFormSubmissionWorkflowClient: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient,
    @inject("grpc:acme.forms.v1.FormWorkflowService") private readonly formsFormWorkflowClient: formsFormWorkflowServiceApi.FormWorkflowServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an article.
   */
  async approveArticle(req: contentArticleApprovalServiceApi.ApproveArticleRequest): Promise<contentArticleApprovalServiceApi.ApproveArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "ApproveArticle", req);
    this.logger.info("approve_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.CalculatePreferenceRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.article?.billingAddress?.locality ?? "") },
      },
      preference: {
        audit: {
          createdBy: (req?.article?.audit?.createdBy ?? ""),
          updatedBy: (req?.article?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const cloned1: customersPreferenceCalculationServiceApi.CalculatePreferenceRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<customersPreferenceCalculationServiceApi.CalculatePreferenceRequest, customersPreferenceCalculationServiceApi.CalculatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.calculatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersPreferenceCalculationServiceApi.CalculatePreferenceRequest, customersPreferenceCalculationServiceApi.CalculatePreferenceResponse>(invoke1, cloned1);
    const request2 = formsFormWorkflowServiceApi.PauseFormWorkflowRequest.fromPartial({
      context: req?.context,
      form: {
        billingAddress: {
          countryCode: (req?.article?.billingAddress?.countryCode ?? ""),
          recipient: (req?.article?.billingAddress?.recipient ?? ""),
        },
        counterparty: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const decoded2 = formsFormWorkflowServiceApi.PauseFormWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(formsFormWorkflowServiceApi.PauseFormWorkflowRequest.toJSON(request2))),
    );
    const invoke2: Unary<formsFormWorkflowServiceApi.PauseFormWorkflowRequest, formsFormWorkflowServiceApi.PauseFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.pauseFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormWorkflowServiceApi.PauseFormWorkflowRequest, formsFormWorkflowServiceApi.PauseFormWorkflowResponse>(invoke2, decoded2);
    const request3 = bankingBankAccountServiceApi.BatchGetBankAccountsRequest.fromPartial({ context: req?.context });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.banking.v1.BatchGetBankAccountsRequest",
      value: Buffer.from(bankingBankAccountServiceApi.BatchGetBankAccountsRequest.encode(request3).finish()),
    });
    const unpacked3 = bankingBankAccountServiceApi.BatchGetBankAccountsRequest.decode(envelope3.value);
    const invoke3: Unary<bankingBankAccountServiceApi.BatchGetBankAccountsRequest, bankingBankAccountServiceApi.BatchGetBankAccountsResponse> =
      (input, done) => this.bankingBankAccountClient.batchGetBankAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<bankingBankAccountServiceApi.BatchGetBankAccountsRequest, bankingBankAccountServiceApi.BatchGetBankAccountsResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.ApproveArticleResponse.fromPartial({
        article: { audit: { etag: (reply1?.preference?.audit?.etag ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      contentArticleApprovalServiceApi.ApproveArticleResponse.fromPartial({ article: { total: reply2?.form?.total } }),
      contentArticleApprovalServiceApi.ApproveArticleResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      contentArticleApprovalServiceApi.ApproveArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          billingAddress: req?.article?.billingAddress,
        },
      }),
    );
  }

  /**
   * Delegates an article.
   */
  async delegateArticleApproval(req: contentArticleApprovalServiceApi.DelegateArticleApprovalRequest): Promise<contentArticleApprovalServiceApi.DelegateArticleApprovalResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "DelegateArticleApproval", req);
    this.logger.info("delegate_article_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      contentRevision: {
        subject: { displayName: (req?.article?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
        },
      },
    });
    const client1 = this.clients.get<contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient>("acme.content.v1.ContentRevisionCalculationService");
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> =
      (input, done) => client1.compareContentRevisionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>(invoke1, request1);
    const request2 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          audit: { updatedAt: req?.article?.audit?.updatedAt },
          children: [{
            audit: { updatedBy: (req?.article?.audit?.updatedBy ?? "") },
            manager: { userId: (req?.details?.approver?.userId ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient.explainHouseholdCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.contentRevision?.subject?.email ?? "") } },
      formSubmission: {
        subject: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.retryFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse>(invoke3, request3));
    const request4 = mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.article?.articleId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply4 = await upload<mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest, mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse>(
      (done) => this.mediaTranscodeJobImportClient.importTranscodeJobs(metadataFor(request4.context), { deadline: Date.now() + 15_000 }, done), [request4],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.DelegateArticleApprovalResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      contentArticleApprovalServiceApi.DelegateArticleApprovalResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      contentArticleApprovalServiceApi.DelegateArticleApprovalResponse.fromPartial({
        article: { lines: [{ attributes: (reply3?.formSubmission?.attributes ?? {}) }] },
      }),
      contentArticleApprovalServiceApi.DelegateArticleApprovalResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          status: req?.article?.status,
        },
      }),
    );
  }

  /**
   * Escalates an article.
   */
  async escalateArticle(req: contentArticleApprovalServiceApi.EscalateArticleRequest): Promise<contentArticleApprovalServiceApi.EscalateArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "EscalateArticle", req);
    this.logger.info("escalate_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest.fromPartial({
      contentRevision: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.article?.billingAddress?.countryCode ?? ""),
          lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
          locality: (req?.article?.billingAddress?.locality ?? ""),
        },
      },
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.calculateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("EscalateArticle.CalculateContentRevision", () => call<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.EscalateArticleResponse.fromPartial({
        result: { correlationId: (reply1?.contentRevision?.correlationId ?? "") },
      }),
      contentArticleApprovalServiceApi.EscalateArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          number: (req?.article?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an article.
   */
  async getArticleApprovalStatus(req: contentArticleApprovalServiceApi.GetArticleApprovalStatusRequest): Promise<contentArticleApprovalServiceApi.GetArticleApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.articleId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "article_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetArticleApprovalStatus", req);
    this.logger.info("get_article_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    return contentArticleApprovalServiceApi.GetArticleApprovalStatusResponse.fromPartial({ article: { articleId: (req?.articleId ?? "") } });
  }

  /**
   * Lists articles a page at a time.
   */
  async listPendingArticles(req: contentArticleApprovalServiceApi.ListPendingArticlesRequest): Promise<contentArticleApprovalServiceApi.ListPendingArticlesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingArticles", req);
    this.logger.info("list_pending_articles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      contentRevision: { occurredAt: req?.filter?.createdAfter },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.explainContentRevisionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: req?.filter?.createdAfter },
        owner: {
          displayName: (reply1?.contentRevision?.subject?.displayName ?? ""),
          email: (reply1?.contentRevision?.subject?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse>(
      "acme.content.v1.ArticleApprovalService/ListPendingArticles:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.ListPendingArticlesResponse.fromPartial({
        articles: [{
          counterparty: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
        }],
      }),
      contentArticleApprovalServiceApi.ListPendingArticlesResponse.fromPartial({
        articles: [{
          audit: { createdAt: reply2?.subscription?.audit?.createdAt },
          lines: [{
            tax: {
              amount: (reply2?.subscription?.action?.$case === "discount" ? reply2?.subscription?.action.discount : undefined)?.amount,
            },
          }],
        }],
      }),
    );
  }

  /**
   * Rejects an article.
   */
  async rejectArticle(req: contentArticleApprovalServiceApi.RejectArticleRequest): Promise<contentArticleApprovalServiceApi.RejectArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "RejectArticle", req);
    this.logger.info("reject_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            location: {
              lines: (req?.article?.billingAddress?.lines ?? []).map((value) => value),
              postalCode: (req?.article?.billingAddress?.postalCode ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest, contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse> =
      (input, done) => this.contentTaxonomyValidationClient.validateTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest, contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { updatedBy: (reply1?.taxonomy?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (req?.article?.counterparty?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.previewAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.RejectArticleResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      contentArticleApprovalServiceApi.RejectArticleResponse.fromPartial({
        article: { audit: { etag: (reply2?.accessPolicy?.audit?.etag ?? "") } },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      contentArticleApprovalServiceApi.RejectArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          billingAddress: req?.article?.billingAddress,
        },
      }),
    );
  }

  /**
   * Submits an article.
   */
  async submitArticle(req: contentArticleApprovalServiceApi.SubmitArticleRequest): Promise<contentArticleApprovalServiceApi.SubmitArticleResponse> {
    validateContext(req.context);
    if (req.article) {
      await this.repository.save(toArticleRecord(req.context.tenantId, req.article));
    }
    await this.repository.record(req.context.tenantId, "SubmitArticle", req);
    this.logger.info("submit_article", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      metricSeries: { audit: { createdBy: (req?.article?.audit?.createdBy ?? "") } },
    });
    const invoke1: Unary<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.lintMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        kind: (req?.article?.counterparty?.kind ?? ""),
        measurements: [{ unit: (reply1?.metricSeries?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.article?.counterparty?.displayName ?? "") },
      },
    });
    const invoke2: Unary<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.cancelFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentArticleApprovalServiceApi.SubmitArticleResponse.fromPartial({
        article: {
          billingAddress: {
            countryCode: ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.countryCode ?? ""),
          },
        },
      }),
      contentArticleApprovalServiceApi.SubmitArticleResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
        },
      }),
      contentArticleApprovalServiceApi.SubmitArticleResponse.fromPartial({
        article: {
          articleId: (req?.articleId ?? ""),
          total: req?.article?.total,
        },
      }),
    );
  }
}
