/**
 * Runs the long-lived workflow that takes a content revision from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as contentArticleWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentContentRevisionWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import * as contentTaxonomyLifecycleServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toContentRevisionRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content revision operations and persist audit data.
 */
@injectable()
export class ContentRevisionWorkflowWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.content.v1.ArticleWorkflowService") private readonly contentArticleWorkflowClient: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyLifecycleService") private readonly contentTaxonomyLifecycleClient: contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionWorkflowService") private readonly surveysQuestionWorkflowClient: surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointService") private readonly webhooksWebhookEndpointClient: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a content revision.
   */
  async advanceContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "AdvanceContentRevisionWorkflow", req);
    this.logger.info("advance_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
        requester: {
          email: (req?.contentRevision?.subject?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse> =
      (input, done) => this.notificationsNotificationSyncClient.pushNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceContentRevisionWorkflow.PushNotification", () => call<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(invoke1, request1));
    const request2 = contentArticleWorkflowServiceApi.SignalArticleWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke2: Unary<contentArticleWorkflowServiceApi.SignalArticleWorkflowRequest, contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.signalArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse.fromPartial({
        contentRevision: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { status: (reply1?.outcome?.status ?? "") },
      }),
      contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          kind: (req?.contentRevision?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a content revision.
   */
  async cancelContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "CancelContentRevisionWorkflow", req);
    this.logger.info("cancel_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.RecalculateCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        contact: { name: req?.details?.notify?.name },
        relationshipManager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>(
      "acme.content.v1.ContentRevisionWorkflowService/CancelContentRevisionWorkflow:0", request1,
    );
    const request2 = contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest.fromPartial({
      contentRevisionId: (req?.contentRevision?.contentRevisionId ?? ""),
      context: req?.context,
    });
    const invoke2: Unary<contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest, contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse> =
      (input, done) => this.contentContentRevisionValidationClient.getContentRevisionRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest, contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse>(invoke2, request2));
    const request3 = customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { updatedBy: (reply1?.customer?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (req?.contentRevision?.subject?.displayName ?? ""),
          email: (reply1?.customer?.relationshipManager?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.recalculateCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest.fromPartial({
      article: { audit: { createdAt: reply1?.customer?.audit?.createdAt } },
      context: req?.context,
      details: { notify: { email: (reply3?.customerSegment?.owner?.email ?? "") } },
    });
    const invoke4: Unary<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.cancelArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse.fromPartial({ contentRevision: { attributes: (reply1?.customer?.attributes ?? {}) } }),
      contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse.fromPartial({
        contentRevision: { sequence: (reply2?.contentRevision?.sequence ?? 0) },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse.fromPartial({
        contentRevision: { subject: { email: (reply3?.customerSegment?.owner?.email ?? "") } },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse.fromPartial({
        outcome: { message: (reply4?.outcome?.message ?? "") },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          source: (req?.contentRevision?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Lists content revisions a page at a time.
   */
  async listContentRevisionWorkflows(req: contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest): Promise<contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListContentRevisionWorkflows", req);
    this.logger.info("list_content_revision_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a content revision.
   */
  async pauseContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "PauseContentRevisionWorkflow", req);
    this.logger.info("pause_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
            }],
            manager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryRequest, contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryResponse> =
      (input, done) => this.contentTaxonomyLifecycleClient.scheduleTaxonomyExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest.fromPartial({
      context: req?.context,
      question: { owner: { userId: (reply1?.taxonomy?.manager?.userId ?? "") } },
    });
    const method2 = "advanceQuestionWorkflow" as const;
    const invoke2: Unary<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse> =
      (input, done) => this.surveysQuestionWorkflowClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse.fromPartial({
        contentRevision: {
          attributes: (req?.contentRevision?.attributes ?? {}),
          contentRevisionId: (req?.contentRevisionId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a content revision.
   */
  async resumeContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.ResumeContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.ResumeContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ResumeContentRevisionWorkflow", req);
    this.logger.info("resume_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request1 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
        consentRecord: {
          measurements: [{
            metric: (item?.metric ?? ""),
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> =
        (input, done) => this.customersConsentRecordCalculationClient.recalculateConsentRecords(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentContentRevisionWorkflowServiceApi.ResumeContentRevisionWorkflowResponse.fromPartial({
      contentRevision: {
        contentRevisionId: (req?.contentRevisionId ?? ""),
        correlationId: (req?.contentRevision?.correlationId ?? ""),
      },
    });
  }

  /**
   * Signals a content revision.
   */
  async signalContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "SignalContentRevisionWorkflow", req);
    this.logger.info("signal_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
      subscription: { owner: { email: (req?.details?.notify?.email ?? "") } },
    });
    const proxy1 = forwarding(this.notificationsSubscriptionCalculationClient);
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse> =
      (input, done) => proxy1.explainSubscriptionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse>> = [];
    for (const item of (req?.contentRevision?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest.fromPartial({
          context: req?.context,
          metricSeries: { dimensions: { unit: (item?.unit ?? "") } },
        });
        const invoke2: Unary<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse> =
          (input, done) => this.metricsMetricSeriesValidationClient.lintMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowResponse.fromPartial({
        contentRevision: { subject: { email: (reply1?.subscription?.owner?.email ?? "") } },
        outcome: { message: (reply1?.outcome?.message ?? "") },
      }),
      contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          correlationId: (req?.contentRevision?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a content revision.
   */
  async startContentRevisionWorkflow(req: contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowRequest): Promise<contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "StartContentRevisionWorkflow", req);
    this.logger.info("start_content_revision_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerServiceApi.ListCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentRevision?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.contentRevision?.correlationId ?? ""),
      },
    });
    const invoke1: Unary<customersCustomerServiceApi.ListCustomersRequest, customersCustomerServiceApi.ListCustomersResponse> =
      (input, done) => this.customersCustomerClient.listCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerServiceApi.ListCustomersRequest, customersCustomerServiceApi.ListCustomersResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentRevision?.occurredAt,
        ownerId: (req?.contentRevision?.subject?.customerId ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.findNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse>(invoke2, spread2);
    const request3 = webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.contentRevision?.source ?? ""),
        submittedBy: req?.details?.notify,
      } },
      sequence: (req?.contentRevision?.sequence ?? 0),
    });
    const reply3 = await upload<webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse>(
      (done) => this.webhooksWebhookEndpointClient.batchCreateWebhookEndpoints(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          kind: (req?.contentRevision?.kind ?? ""),
        },
      }),
    );
  }
}
