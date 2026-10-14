/**
 * Routes questions through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as chatHandoffSyncServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as lineageLineageNodeServiceApi from "../../../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
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
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toQuestionRecord } from "../../data/records.js";
import { SurveysRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate question operations and persist audit data.
 */
@injectable()
export class QuestionApprovalWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeService") private readonly lineageLineageNodeClient: lineageLineageNodeServiceApi.LineageNodeServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyWorkflowService") private readonly surveysSurveyWorkflowClient: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a question.
   */
  async approveQuestion(req: surveysQuestionApprovalServiceApi.ApproveQuestionRequest): Promise<surveysQuestionApprovalServiceApi.ApproveQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ApproveQuestion", req);
    this.logger.info("approve_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.SimulateQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: {
          createdAt: req?.question?.audit?.createdAt,
          updatedAt: req?.question?.audit?.updatedAt,
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.simulateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse>(invoke1, spread1);
    const tasks2: Array<() => Promise<surveysQuestionValidationServiceApi.LintQuestionsResponse>> = [];
    for (const item of (req?.question?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = surveysQuestionValidationServiceApi.LintQuestionsRequest.fromPartial({
          context: req?.context,
          question: { conditions: [{ operator: (item?.operator ?? "") }] },
        });
        const invoke2: Unary<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse> =
          (input, done) => this.surveysQuestionValidationClient.lintQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? surveysQuestionValidationServiceApi.LintQuestionsResponse.fromPartial({});
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = customersHouseholdCalculationServiceApi.RecalculateHouseholdsRequest.fromPartial({
      context: input3?.context,
      household: {
        children: [{
          children: [{
            manager: {
              displayName: (reply2?.question?.owner?.displayName ?? ""),
              email: (input3?.question?.owner?.email ?? ""),
              userId: (reply1?.question?.owner?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke3: Unary<customersHouseholdCalculationServiceApi.RecalculateHouseholdsRequest, customersHouseholdCalculationServiceApi.RecalculateHouseholdsResponse> =
      (input, done) => this.customersHouseholdCalculationClient.recalculateHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdCalculationServiceApi.RecalculateHouseholdsRequest, customersHouseholdCalculationServiceApi.RecalculateHouseholdsResponse>(invoke3, request3);
    const results4 = await Promise.all((req?.question?.conditions ?? []).map(async (item) => {
      const request4 = surveysQuestionValidationServiceApi.NormalizeQuestionRequest.fromPartial({
        context: req?.context,
        question: { conditions: [{ attribute: (item?.attribute ?? "") }] },
      });
      const invoke4: Unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse> =
        (input, done) => this.surveysQuestionValidationClient.normalizeQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse>(invoke4, request4);
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.ApproveQuestionResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      surveysQuestionApprovalServiceApi.ApproveQuestionResponse.fromPartial({
        question: { audit: { createdBy: (reply3?.household?.audit?.createdBy ?? "") } },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      surveysQuestionApprovalServiceApi.ApproveQuestionResponse.fromPartial({
        question: {
          questionId: (req?.questionId ?? ""),
          version: (req?.question?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Comments a question.
   */
  async commentQuestionApproval(req: surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest): Promise<surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "CommentQuestionApproval", req);
    this.logger.info("comment_question_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_4: commonMoneyApi.Money | undefined;
    switch (req?.question?.action?.$case) {
      case "discount":
        selected1_4 = (req?.question?.action?.$case === "discount" ? req?.question?.action.discount : undefined)?.amount;
        break;
      default:
        selected1_4 = undefined;
    }
    const request1 = surveysQuestionValidationServiceApi.ScoreQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: {
          createdBy: (req?.question?.audit?.createdBy ?? ""),
          updatedBy: (req?.question?.audit?.updatedBy ?? ""),
        },
        action: { $case: "discount", discount: { amount: selected1_4 } },
        owner: { email: (req?.question?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.scoreQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse>(invoke1, request1);
    const request2 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: {
              createdBy: (reply1?.question?.audit?.createdBy ?? ""),
              etag: (req?.question?.audit?.etag ?? ""),
            },
            manager: { displayName: (req?.details?.approver?.displayName ?? "") },
          }],
        }],
      },
    });
    const decoded2 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.toJSON(request2))),
    );
    const invoke2: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient.explainHouseholdCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse.fromPartial({ question: { audit: { etag: (reply1?.question?.audit?.etag ?? "") } } }),
      surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        question: { questionId: (req?.questionId ?? "") },
      }),
    );
  }

  /**
   * Delegates a question.
   */
  async delegateQuestionApproval(req: surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest): Promise<surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "DelegateQuestionApproval", req);
    this.logger.info("delegate_question_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.fromPartial({
      context: req?.context,
      question: { audit: { updatedBy: (req?.question?.audit?.updatedBy ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.CompareQuestionOptionsRequest",
      value: Buffer.from(surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.decode(envelope1.value);
    const invoke1: Unary<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse> =
      (input, done) => this.surveysQuestionCalculationClient.compareQuestionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>(invoke1, unpacked1);
    let selected2_2: string | undefined;
    switch (req?.question?.action?.$case) {
      case "block":
        selected2_2 = ((req?.question?.action?.$case === "block" ? req?.question?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = experimentsVariantReportingServiceApi.ShareVariantReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.question?.owner?.email ?? "") } },
      reason: (selected2_2 ?? ""),
    });
    const invoke2: Unary<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse> =
      (input, done) => this.experimentsVariantReportingClient.shareVariantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        question: { parameters: (reply1?.question?.parameters ?? {}) },
      }),
      surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        question: { priority: (reply2?.variant?.priority ?? 0) },
      }),
      surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        question: { questionId: (req?.questionId ?? "") },
      }),
    );
  }

  /**
   * Escalates a question.
   */
  async escalateQuestion(req: surveysQuestionApprovalServiceApi.EscalateQuestionRequest): Promise<surveysQuestionApprovalServiceApi.EscalateQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "EscalateQuestion", req);
    this.logger.info("escalate_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = lineageLineageNodeServiceApi.SearchLineageNodesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.question?.questionId ?? ""),
      },
    });
    const invoke1: Unary<lineageLineageNodeServiceApi.SearchLineageNodesRequest, lineageLineageNodeServiceApi.SearchLineageNodesResponse> =
      (input, done) => this.lineageLineageNodeClient.searchLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<lineageLineageNodeServiceApi.SearchLineageNodesRequest, lineageLineageNodeServiceApi.SearchLineageNodesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.question?.owner?.userId ?? ""),
      },
    });
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesRequest, surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.listPendingSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesRequest, surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse>(invoke2, request2));
    const request3 = surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.question?.owner?.displayName ?? "") },
        approverEmail: (req?.details?.approverEmail ?? ""),
      },
      surveyResponse: { subject: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke3: Unary<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.rejectSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("EscalateQuestion.RejectSurveyResponse", () => call<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.EscalateQuestionResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      surveysQuestionApprovalServiceApi.EscalateQuestionResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      surveysQuestionApprovalServiceApi.EscalateQuestionResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      surveysQuestionApprovalServiceApi.EscalateQuestionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        question: { questionId: (req?.questionId ?? "") },
      }),
    );
  }

  /**
   * Returns a question.
   */
  async getQuestionApprovalStatus(req: surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusRequest): Promise<surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.questionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "question_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetQuestionApprovalStatus", req);
    this.logger.info("get_question_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffSyncServiceApi.PullHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        history: [{ changedAt: req?.context?.deadline }],
        requester: { email: (req?.context?.actor?.email ?? "") },
        subject: (req?.questionId ?? ""),
      },
    });
    const invoke1: Unary<chatHandoffSyncServiceApi.PullHandoffsRequest, chatHandoffSyncServiceApi.PullHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.pullHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusResponse.fromPartial({
        question: { audit: { etag: (reply1?.handoff?.audit?.etag ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusResponse.fromPartial({ question: { questionId: (req?.questionId ?? "") } }),
    );
  }

  /**
   * Lists questions a page at a time.
   */
  async listPendingQuestions(req: surveysQuestionApprovalServiceApi.ListPendingQuestionsRequest): Promise<surveysQuestionApprovalServiceApi.ListPendingQuestionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingQuestions", req);
    this.logger.info("list_pending_questions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest.fromPartial({
      context: req?.context,
      customerSegment: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>(
      "acme.surveys.v1.QuestionApprovalService/ListPendingQuestions:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysQuestionApprovalServiceApi.ListPendingQuestionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Recalls a question.
   */
  async recallQuestion(req: surveysQuestionApprovalServiceApi.RecallQuestionRequest): Promise<surveysQuestionApprovalServiceApi.RecallQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "RecallQuestion", req);
    this.logger.info("recall_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerServiceApi.CreateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: {
          createdAt: req?.question?.audit?.createdAt,
          createdBy: (req?.question?.audit?.createdBy ?? ""),
          etag: (req?.question?.audit?.etag ?? ""),
        },
        relationshipManager: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerServiceApi.CreateCustomerRequest, customersCustomerServiceApi.CreateCustomerResponse> =
      (input, done) => this.customersCustomerClient.createCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<customersCustomerServiceApi.CreateCustomerRequest, customersCustomerServiceApi.CreateCustomerResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.RecallQuestionResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysQuestionApprovalServiceApi.RecallQuestionResponse.fromPartial({
        question: {
          questionId: (req?.questionId ?? ""),
          status: req?.question?.status,
        },
      }),
    );
  }

  /**
   * Rejects a question.
   */
  async rejectQuestion(req: surveysQuestionApprovalServiceApi.RejectQuestionRequest): Promise<surveysQuestionApprovalServiceApi.RejectQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "RejectQuestion", req);
    this.logger.info("reject_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
      survey: {
        lines: [{
          tax: {
            amount: (req?.question?.action?.$case === "discount" ? req?.question?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const invoke1: Unary<surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse> =
      (input, done) => this.surveysSurveyWorkflowClient.advanceSurveyWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = surveysQuestionValidationServiceApi.NormalizeQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        owner: { displayName: (reply1?.survey?.counterparty?.displayName ?? "") },
      },
    });
    const invoke2: Unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.normalizeQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = experimentsVariantReportingServiceApi.StreamVariantMetricsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.survey?.billingAddress?.region ?? "") },
    });
    const stream3 = this.experimentsVariantReportingClient.streamVariantMetrics(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? experimentsVariantReportingServiceApi.StreamVariantMetricsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.RejectQuestionResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      surveysQuestionApprovalServiceApi.RejectQuestionResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      surveysQuestionApprovalServiceApi.RejectQuestionResponse.fromPartial({
        question: {
          name: (req?.question?.name ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a question.
   */
  async submitQuestion(req: surveysQuestionApprovalServiceApi.SubmitQuestionRequest): Promise<surveysQuestionApprovalServiceApi.SubmitQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "SubmitQuestion", req);
    this.logger.info("submit_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        measurements: [{ observedAt: req?.question?.audit?.updatedAt }],
        source: (req?.details?.approver?.userId ?? ""),
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream1 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const reading1 = collect(stream1);
    const writing1 = (async () => {
      await write(stream1, request1);
      stream1.end();
    })();
    const [messages1] = await Promise.all([reading1, writing1]);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    const request2 = customersCustomerServiceApi.UpdateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: {
          createdAt: req?.question?.audit?.createdAt,
          createdBy: (req?.question?.audit?.createdBy ?? ""),
          etag: (req?.question?.audit?.etag ?? ""),
        },
        relationshipManager: { userId: (req?.question?.owner?.userId ?? "") },
      },
    });
    const invoke2: Unary<customersCustomerServiceApi.UpdateCustomerRequest, customersCustomerServiceApi.UpdateCustomerResponse> =
      (input, done) => this.customersCustomerClient.updateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: {
        subject: { email: (reply2?.customer?.relationshipManager?.email ?? "") },
      },
    });
    const method3 = "previewSurveyResponse" as const;
    const invoke3: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(invoke3, request3);
    const request4 = experimentsExposureSyncServiceApi.ReconcileExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: { displayName: (reply3?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const proxy4 = forwarding(this.experimentsExposureSyncClient);
    const invoke4: Unary<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse> =
      (input, done) => proxy4.reconcileExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionApprovalServiceApi.SubmitQuestionResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      surveysQuestionApprovalServiceApi.SubmitQuestionResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { message: (reply3?.outcome?.message ?? "") },
      }),
      surveysQuestionApprovalServiceApi.SubmitQuestionResponse.fromPartial({ outcome: { effectiveAt: reply4?.outcome?.effectiveAt } }),
      surveysQuestionApprovalServiceApi.SubmitQuestionResponse.fromPartial({
        question: {
          name: (req?.question?.name ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }
}
