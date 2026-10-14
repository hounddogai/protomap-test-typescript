/**
 * Answers read-only questions about survey responses, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { SurveysRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey response operations and persist audit data.
 */
@injectable()
export class SurveyResponseQueryWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists survey responses a page at a time.
   */
  async browseSurveyResponses(req: surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseSurveyResponses", req);
    this.logger.info("browse_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse.fromPartial({});
  }

  /**
   * Counts survey responses by status.
   */
  async countSurveyResponses(req: surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountSurveyResponses", req);
    this.logger.info("count_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.ScoreQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      question: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.scoreQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<surveysQuestionValidationServiceApi.ScoreQuestionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Streams every matching survey response.
   */
  async exportSurveyResponses(req: surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportSurveyResponses", req);
    this.logger.info("export_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      surveyResponse: {
        measurements: [{ observedAt: req?.filter?.createdAfter }],
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionRequest, surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.explainSurveyResponseDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: {
          displayName: (reply1?.surveyResponse?.subject?.displayName ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (reply1?.surveyResponse?.subject?.email ?? "") } },
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: { assignee: { email: (reply2?.chatRoom?.owner?.email ?? "") } },
    });
    const method3 = "quoteTranslationJob" as const;
    const invoke3: Unary<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesResponse.fromPartial({
        surveyResponse: { correlationId: (reply1?.surveyResponse?.correlationId ?? "") },
      }),
      surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        surveyResponse: { measurements: [{ unit: (reply2?.chatRoom?.dimensions?.unit ?? "") }] },
      }),
      surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesResponse.fromPartial({
        surveyResponse: {
          subject: {
            customerId: ((reply3?.translationJob?.origin?.$case === "customer" ? reply3?.translationJob?.origin.customer : undefined)?.customerId ?? ""),
          },
        },
      }),
    );
  }

  /**
   * Lists survey responses a page at a time.
   */
  async findSurveyResponses(req: surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindSurveyResponses", req);
    this.logger.info("find_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.notificationsSubscriptionHistoryClient);
    const invoke1: Unary<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse> =
      (input, done) => proxy1.recordSubscriptionVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Returns a survey response.
   */
  async lookupSurveyResponse(req: surveysSurveyResponseQueryServiceApi.LookupSurveyResponseRequest): Promise<surveysSurveyResponseQueryServiceApi.LookupSurveyResponseResponse> {
    validateContext(req.context);
    if (!req.surveyResponseId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_response_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupSurveyResponse", req);
    this.logger.info("lookup_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      surveyResponse: {
        source: (req?.context?.actor?.userId ?? ""),
        subject: { email: (req?.context?.actor?.email ?? "") },
        surveyResponseId: (req?.surveyResponseId ?? ""),
      },
    });
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.checkSurveyResponseEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse>(invoke1, request1);
    return surveysSurveyResponseQueryServiceApi.LookupSurveyResponseResponse.fromPartial({
      surveyResponse: { surveyResponseId: (reply1?.surveyResponse?.surveyResponseId ?? "") },
    });
  }

  /**
   * Returns a survey response.
   */
  async peekSurveyResponse(req: surveysSurveyResponseQueryServiceApi.PeekSurveyResponseRequest): Promise<surveysSurveyResponseQueryServiceApi.PeekSurveyResponseResponse> {
    validateContext(req.context);
    if (!req.surveyResponseId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_response_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekSurveyResponse", req);
    this.logger.info("peek_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.CalculateChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.context?.deadline },
        components: { primary: { componentId: (req?.surveyResponseId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.calculateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse>(invoke1, spread1);
    return mergeResponses(
      surveysSurveyResponseQueryServiceApi.PeekSurveyResponseResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      surveysSurveyResponseQueryServiceApi.PeekSurveyResponseResponse.fromPartial({ surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") } }),
    );
  }

  /**
   * Returns several survey responses at once.
   */
  async resolveSurveyResponses(req: surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveSurveyResponses", req);
    this.logger.info("resolve_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityModerationValidationServiceApi.ValidateModerationRequest.fromPartial({
      context: input1?.context,
      details: {
        contact: { email: (input1?.context?.actor?.email ?? "") },
        locale: (input1?.context?.locale ?? ""),
      },
      moderation: {
        assignee: { userId: (input1?.context?.actor?.userId ?? "") },
        sla: { dueAt: input1?.context?.deadline },
      },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.ValidateModerationRequest, communityModerationValidationServiceApi.ValidateModerationResponse> =
      (input, done) => this.communityModerationValidationClient.validateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.ValidateModerationRequest, communityModerationValidationServiceApi.ValidateModerationResponse>(invoke1, request1);
    return surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Lists survey responses a page at a time.
   */
  async suggestSurveyResponses(req: surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestSurveyResponses", req);
    this.logger.info("suggest_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse.fromPartial({});
  }

  /**
   * Summarizes a survey response.
   */
  async summarizeSurveyResponses(req: surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesRequest): Promise<surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeSurveyResponses", req);
    this.logger.info("summarize_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      question: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const cloned1: surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse> =
      (input, done) => this.surveysQuestionCalculationClient.recalculateQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>(invoke1, cloned1);
    const request2 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: {
          createdBy: (reply1?.question?.audit?.createdBy ?? ""),
          etag: (reply1?.question?.audit?.etag ?? ""),
          updatedBy: (reply1?.question?.audit?.updatedBy ?? ""),
        },
        action: { $case: "block", block: {
          reason: ((reply1?.question?.action?.$case === "block" ? reply1?.question?.action.block : undefined)?.reason ?? ""),
        } },
      },
    });
    const decoded2 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysQuestionCalculationServiceApi.CalculateQuestionRequest.toJSON(request2))),
    );
    const invoke2: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
