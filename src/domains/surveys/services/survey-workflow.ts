/**
 * Runs the long-lived workflow that takes a survey from start to finish. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as returnsReturnRequestQueryServiceApi from "../../../../.cache/proto/acme/returns/v1/return_request_query_service.js";
import * as schedulingShiftServiceApi from "../../../../.cache/proto/acme/scheduling/v1/shift_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysSurveyQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSurveyRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey operations and persist audit data.
 */
@injectable()
export class SurveyWorkflowWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobApprovalService") private readonly localizationTranslationJobApprovalClient: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.returns.v1.ReturnRequestQueryService") private readonly returnsReturnRequestQueryClient: returnsReturnRequestQueryServiceApi.ReturnRequestQueryServiceClient,
    @inject("grpc:acme.scheduling.v1.ShiftService") private readonly schedulingShiftClient: schedulingShiftServiceApi.ShiftServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyQueryService") private readonly surveysSurveyQueryClient: surveysSurveyQueryServiceApi.SurveyQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyService") private readonly surveysSurveyClient: surveysSurveyServiceApi.SurveyServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a survey.
   */
  async advanceSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "AdvanceSurveyWorkflow", req);
    this.logger.info("advance_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = returnsReturnRequestQueryServiceApi.FindReturnRequestsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<returnsReturnRequestQueryServiceApi.FindReturnRequestsRequest, returnsReturnRequestQueryServiceApi.FindReturnRequestsResponse> =
      (input, done) => this.returnsReturnRequestQueryClient.findReturnRequests(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.survey?.billingAddress?.lines ?? []).map((value) => value),
          postalCode: (req?.survey?.billingAddress?.postalCode ?? ""),
        },
      },
      question: {
        audit: {
          createdBy: (req?.survey?.audit?.createdBy ?? ""),
          updatedAt: req?.survey?.audit?.updatedAt,
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>(
      "acme.surveys.v1.SurveyWorkflowService/AdvanceSurveyWorkflow:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse.fromPartial({
        survey: { counterparty: { version: (reply2?.question?.version ?? 0) } },
      }),
      surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse.fromPartial({
        survey: {
          metadata: (req?.survey?.metadata ?? {}),
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a survey.
   */
  async cancelSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "CancelSurveyWorkflow", req);
    this.logger.info("cancel_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.dueAt,
        ownerId: (req?.survey?.counterparty?.questionId ?? ""),
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest, experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse> =
      (input, done) => this.experimentsExperimentWorkflowClient.listExperimentWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest, experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse>(invoke1, request1));
    const request2 = surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.survey?.counterparty?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.rejectSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.survey?.billingAddress?.region ?? "") },
    });
    const invoke3: Unary<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse> =
      (input, done) => this.notificationsNotificationTemplateHistoryClient.listNotificationTemplateVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse.fromPartial({
        survey: {
          surveyId: (req?.surveyId ?? ""),
          total: req?.survey?.total,
        },
      }),
    );
  }

  /**
   * Returns a survey.
   */
  async inspectSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowResponse> {
    validateContext(req.context);
    if (!req.surveyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectSurveyWorkflow", req);
    this.logger.info("inspect_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.delegateSurveyResponseApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowResponse.fromPartial({ survey: { surveyId: (req?.surveyId ?? "") } }),
    );
  }

  /**
   * Lists surveys a page at a time.
   */
  async listSurveyWorkflows(req: surveysSurveyWorkflowServiceApi.ListSurveyWorkflowsRequest): Promise<surveysSurveyWorkflowServiceApi.ListSurveyWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSurveyWorkflows", req);
    this.logger.info("list_survey_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      question: {
        audit: { createdAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const method1 = "calculateQuestion" as const;
    const invoke1: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyWorkflowServiceApi.ListSurveyWorkflowsResponse.fromPartial({
      surveys: [{ audit: { createdBy: (reply1?.question?.audit?.createdBy ?? "") } }],
    });
  }

  /**
   * Pauses a survey.
   */
  async pauseSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "PauseSurveyWorkflow", req);
    this.logger.info("pause_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.ScoreAuditEventRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.survey?.billingAddress?.postalCode ?? ""),
          region: (req?.survey?.billingAddress?.region ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.auditAuditEventValidationClient);
    const invoke1: Unary<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse> =
      (input, done) => proxy1.scoreAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse.fromPartial({
        survey: { lines: [{ attributes: (reply1?.auditEvent?.attributes ?? {}) }] },
      }),
      surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse.fromPartial({
        survey: {
          billingAddress: req?.survey?.billingAddress,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a survey.
   */
  async retrySurveyWorkflow(req: surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "RetrySurveyWorkflow", req);
    this.logger.info("retry_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest.fromPartial({
      context: req?.context,
      translationJob: {
        audit: {
          updatedAt: req?.survey?.audit?.updatedAt,
          updatedBy: (req?.survey?.audit?.updatedBy ?? ""),
        },
        origin: { $case: "customer", customer: { displayName: (req?.survey?.counterparty?.displayName ?? "") } },
        requester: { phone: (req?.details?.notify?.phone ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest, localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse> =
      (input, done) => this.localizationTranslationJobApprovalClient.delegateTranslationJobApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest, localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse>(invoke1, request1);
    const request2 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          email: ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.email ?? ""),
        },
        audit: { createdAt: req?.survey?.audit?.createdAt },
        requester: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.recalculateNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.fromPartial({
      context: input3?.context,
      question: {
        owner: {
          email: ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.email ?? ""),
          userId: (reply1?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse> =
      (input, done) => this.surveysQuestionCalculationClient.recalculateQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse.fromPartial({
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
        survey: { audit: { createdBy: (reply2?.notification?.audit?.createdBy ?? "") } },
      }),
      surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse.fromPartial({
        survey: { counterparty: { version: (reply3?.question?.version ?? 0) } },
      }),
      surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse.fromPartial({
        survey: {
          notes: (req?.survey?.notes ?? ""),
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a survey.
   */
  async signalSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "SignalSurveyWorkflow", req);
    this.logger.info("signal_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.survey?.settlement?.$case) {
      case "card":
        selected1_2 = ((req?.survey?.settlement?.$case === "card" ? req?.survey?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.survey?.billingAddress?.locality ?? "") },
      },
      notificationTemplate: {
        billingAddress: {
          countryCode: (req?.survey?.billingAddress?.countryCode ?? ""),
          recipient: (req?.survey?.billingAddress?.recipient ?? ""),
        },
        settlement: { $case: "card", card: { holderName: (selected1_2 ?? "") } },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.calculateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse>(invoke1, request1);
    const request2 = surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.notificationTemplate?.counterparty?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
      surveyResponse: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.survey?.counterparty?.displayName ?? "") },
      },
    });
    const decoded2 = surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest.toJSON(request2))),
    );
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.approveSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowResponse.fromPartial({
        survey: {
          dueAt: req?.survey?.dueAt,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a survey.
   */
  async startSurveyWorkflow(req: surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest): Promise<surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "StartSurveyWorkflow", req);
    this.logger.info("start_survey_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyQueryServiceApi.LookupSurveyRequest.fromPartial({
      context: req?.context,
      surveyId: (req?.surveyId ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.LookupSurveyRequest",
      value: Buffer.from(surveysSurveyQueryServiceApi.LookupSurveyRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysSurveyQueryServiceApi.LookupSurveyRequest.decode(envelope1.value);
    const invoke1: Unary<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse> =
      (input, done) => this.surveysSurveyQueryClient.lookupSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse>(invoke1, unpacked1);
    const tasks2: Array<() => Promise<surveysSurveyServiceApi.CloneSurveyResponse>> = [];
    for (const item of (req?.survey?.attachments ?? [])) {
      tasks2.push(async () => {
        const request2 = surveysSurveyServiceApi.CloneSurveyRequest.fromPartial({
          context: req?.context,
          survey: {
            attachments: [{
              checksum: (item?.checksum ?? ""),
              fileName: (item?.fileName ?? ""),
              uri: (item?.uri ?? ""),
            }],
          },
        });
        const invoke2: Unary<surveysSurveyServiceApi.CloneSurveyRequest, surveysSurveyServiceApi.CloneSurveyResponse> =
          (input, done) => this.surveysSurveyClient.cloneSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<surveysSurveyServiceApi.CloneSurveyRequest, surveysSurveyServiceApi.CloneSurveyResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? surveysSurveyServiceApi.CloneSurveyResponse.fromPartial({});
    const request3 = schedulingShiftServiceApi.ListShiftsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.survey?.audit?.updatedAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const client3 = this.clients.get<schedulingShiftServiceApi.ShiftServiceClient>("acme.scheduling.v1.ShiftService");
    const invoke3: Unary<schedulingShiftServiceApi.ListShiftsRequest, schedulingShiftServiceApi.ListShiftsResponse> =
      (input, done) => client3.listShifts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<schedulingShiftServiceApi.ListShiftsRequest, schedulingShiftServiceApi.ListShiftsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse.fromPartial({ survey: { status: reply1?.survey?.status } }),
      surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse.fromPartial({
        survey: {
          surveyId: (req?.surveyId ?? ""),
          total: req?.survey?.total,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for SurveyWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyWorkflowHandler {
  constructor(@inject(SurveyWorkflowWorkflow) private readonly workflow: SurveyWorkflowWorkflow) {}

  /**
   * Advances a survey.
   */
  advanceSurveyWorkflow = unary<surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse>(
    (request) => this.workflow.advanceSurveyWorkflow(request),
  );

  /**
   * Cancels a survey.
   */
  cancelSurveyWorkflow = unary<surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse>(
    (request) => this.workflow.cancelSurveyWorkflow(request),
  );

  /**
   * Returns a survey.
   */
  inspectSurveyWorkflow = (call: ServerUnaryCall<surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowResponse>, done: sendUnaryData<surveysSurveyWorkflowServiceApi.InspectSurveyWorkflowResponse>): void => {
    void this.workflow.inspectSurveyWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists surveys a page at a time.
   */
  listSurveyWorkflows = unary<surveysSurveyWorkflowServiceApi.ListSurveyWorkflowsRequest, surveysSurveyWorkflowServiceApi.ListSurveyWorkflowsResponse>(
    (request) => this.workflow.listSurveyWorkflows(request),
  );

  /**
   * Pauses a survey.
   */
  pauseSurveyWorkflow = unary<surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse>(
    (request) => this.workflow.pauseSurveyWorkflow(request),
  );

  /**
   * Retrys a survey.
   */
  retrySurveyWorkflow = (call: ServerUnaryCall<surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse>, done: sendUnaryData<surveysSurveyWorkflowServiceApi.RetrySurveyWorkflowResponse>): void => {
    void this.workflow.retrySurveyWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a survey.
   */
  signalSurveyWorkflow = unary<surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.SignalSurveyWorkflowResponse>(
    (request) => this.workflow.signalSurveyWorkflow(request),
  );

  /**
   * Starts a survey.
   */
  startSurveyWorkflow = unary<surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse>(
    (request) => this.workflow.startSurveyWorkflow(request),
  );
}

export function implementation(handler: SurveyWorkflowHandler): surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceServer {
  return {
    advanceSurveyWorkflow: handler.advanceSurveyWorkflow,
    cancelSurveyWorkflow: handler.cancelSurveyWorkflow,
    inspectSurveyWorkflow: handler.inspectSurveyWorkflow,
    listSurveyWorkflows: handler.listSurveyWorkflows,
    pauseSurveyWorkflow: handler.pauseSurveyWorkflow,
    retrySurveyWorkflow: handler.retrySurveyWorkflow,
    signalSurveyWorkflow: handler.signalSurveyWorkflow,
    startSurveyWorkflow: handler.startSurveyWorkflow,
  };
}
