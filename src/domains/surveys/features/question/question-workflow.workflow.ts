/**
 * Runs the long-lived workflow that takes a question from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as documentsDocumentServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toQuestionRecord } from "../../data/records.js";
import { SurveysRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate question operations and persist audit data.
 */
@injectable()
export class QuestionWorkflowWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyApprovalService") private readonly surveysSurveyApprovalClient: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseWorkflowService") private readonly surveysSurveyResponseWorkflowClient: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyWorkflowService") private readonly surveysSurveyWorkflowClient: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a question.
   */
  async advanceQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "AdvanceQuestionWorkflow", req);
    this.logger.info("advance_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyApprovalServiceApi.ApproveSurveyRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.details?.notify?.email ?? ""),
          userId: (req?.question?.owner?.userId ?? ""),
        },
      },
      survey: {
        audit: { updatedAt: req?.question?.audit?.updatedAt },
        counterparty: { questionId: (req?.question?.questionId ?? "") },
      },
    });
    const method1 = "approveSurvey" as const;
    const invoke1: Unary<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse> =
      (input, done) => this.surveysSurveyApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse.fromPartial({
        question: {
          audit: { etag: (reply1?.survey?.audit?.etag ?? "") },
          version: (reply1?.survey?.counterparty?.version ?? 0),
        },
      }),
      surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse.fromPartial({
        question: {
          name: (req?.question?.name ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a question.
   */
  async cancelQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "CancelQuestionWorkflow", req);
    this.logger.info("cancel_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      surveyResponse: { subject: { email: (req?.question?.owner?.email ?? "") } },
    });
    const proxy1 = forwarding(this.surveysSurveyResponseWorkflowClient);
    const invoke1: Unary<surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse> =
      (input, done) => proxy1.resumeSurveyResponseWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse>(invoke1, request1);
    const request2 = surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: {
        subject: { displayName: (reply1?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.recallSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        question: { owner: { email: (reply2?.surveyResponse?.subject?.email ?? "") } },
      }),
      surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse.fromPartial({
        question: {
          description: (req?.question?.description ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a question.
   */
  async inspectQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse> {
    validateContext(req.context);
    if (!req.questionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "question_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectQuestionWorkflow", req);
    this.logger.info("inspect_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.QuotePreferenceRequest.fromPartial({
      context: req?.context,
      preference: { owner: { email: (req?.context?.actor?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<customersPreferenceCalculationServiceApi.QuotePreferenceRequest, customersPreferenceCalculationServiceApi.QuotePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.quotePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersPreferenceCalculationServiceApi.QuotePreferenceRequest, customersPreferenceCalculationServiceApi.QuotePreferenceResponse>(invoke1, spread1);
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse.fromPartial({
        question: { audit: { updatedBy: (reply1?.preference?.audit?.updatedBy ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse.fromPartial({ question: { questionId: (req?.questionId ?? "") } }),
    );
  }

  /**
   * Lists questions a page at a time.
   */
  async listQuestionWorkflows(req: surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest): Promise<surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListQuestionWorkflows", req);
    this.logger.info("list_question_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const stream1 = this.personalizationRecommendationReportingClient.streamRecommendationMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a question.
   */
  async pauseQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "PauseQuestionWorkflow", req);
    this.logger.info("pause_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.WatchDocumentsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notify?.email ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.documentsDocumentClient.watchDocuments(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? documentsDocumentServiceApi.WatchDocumentsResponse.fromPartial({});
    const tasks2: Array<() => Promise<customersPreferenceValidationServiceApi.PreviewPreferenceResponse>> = [];
    for (const item of (req?.question?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = customersPreferenceValidationServiceApi.PreviewPreferenceRequest.fromPartial({
          context: req?.context,
          preference: { conditions: [{ negate: (item?.negate ?? false) }] },
        });
        const invoke2: Unary<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse> =
          (input, done) => this.customersPreferenceValidationClient.previewPreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? customersPreferenceValidationServiceApi.PreviewPreferenceResponse.fromPartial({});
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input3?.annotations ?? {}))),
      context: input3?.context,
      reason: ((reply2?.preference?.action?.$case === "block" ? reply2?.preference?.action.block : undefined)?.reason ?? ""),
    });
    const invoke3: Unary<customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest, customersHouseholdQueryServiceApi.SummarizeHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.summarizeHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest, customersHouseholdQueryServiceApi.SummarizeHouseholdsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowResponse.fromPartial({
        question: {
          parameters: (req?.question?.parameters ?? {}),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a question.
   */
  async resumeQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ResumeQuestionWorkflow", req);
    this.logger.info("resume_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.ListPendingForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.question?.owner?.userId ?? ""),
      },
    });
    const cloned1: communityForumApprovalServiceApi.ListPendingForumsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse> =
      (input, done) => this.communityForumApprovalClient.listPendingForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(invoke1, cloned1);
    const request2 = surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notify?.email ?? "") } },
      survey: {
        lines: [{
          amount: (req?.question?.action?.$case === "discount" ? req?.question?.action.discount : undefined)?.amount,
        }],
      },
    });
    const decoded2 = surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest.toJSON(request2))),
    );
    const invoke2: Unary<surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse> =
      (input, done) => this.surveysSurveyWorkflowClient.pauseSurveyWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowResponse.fromPartial({
        question: {
          effective: req?.question?.effective,
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a question.
   */
  async retryQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "RetryQuestionWorkflow", req);
    this.logger.info("retry_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.question?.owner?.userId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.SuggestSurveyResponsesRequest",
      value: Buffer.from(surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest.decode(envelope1.value);
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.suggestSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowResponse.fromPartial({
        question: {
          description: (req?.question?.description ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a question.
   */
  async startQuestionWorkflow(req: surveysQuestionWorkflowServiceApi.StartQuestionWorkflowRequest): Promise<surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "StartQuestionWorkflow", req);
    this.logger.info("start_question_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const client1 = this.clients.get<personalizationAffinityReportingServiceApi.AffinityReportingServiceClient>("acme.personalization.v1.AffinityReportingService");
    const invoke1: Unary<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse> =
      (input, done) => client1.shareAffinityReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { updatedAt: req?.question?.audit?.updatedAt } },
    });
    const invoke2: Unary<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.commentSubscriptionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse.fromPartial({
        question: { effective: reply2?.subscription?.effective },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse.fromPartial({
        question: {
          priority: (req?.question?.priority ?? 0),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }
}
