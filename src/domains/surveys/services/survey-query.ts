/**
 * Answers read-only questions about surveys, for screens and reports. Remote work stays behind typed client ports.
 */

import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysSurveyQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { SurveysRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey operations and persist audit data.
 */
@injectable()
export class SurveyQueryWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists surveys a page at a time.
   */
  async browseSurveys(req: surveysSurveyQueryServiceApi.BrowseSurveysRequest): Promise<surveysSurveyQueryServiceApi.BrowseSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseSurveys", req);
    this.logger.info("browse_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("BrowseSurveys.CalculateQuestion", () => call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyQueryServiceApi.BrowseSurveysResponse.fromPartial({
      result: { correlationId: (reply1?.result?.correlationId ?? "") },
      surveys: [{ audit: { updatedBy: (reply1?.question?.audit?.updatedBy ?? "") } }],
    });
  }

  /**
   * Counts surveys by status.
   */
  async countSurveys(req: surveysSurveyQueryServiceApi.CountSurveysRequest): Promise<surveysSurveyQueryServiceApi.CountSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountSurveys", req);
    this.logger.info("count_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.SimulateQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.simulateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyQueryServiceApi.CountSurveysResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Lists surveys a page at a time.
   */
  async findSurveys(req: surveysSurveyQueryServiceApi.FindSurveysRequest): Promise<surveysSurveyQueryServiceApi.FindSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindSurveys", req);
    this.logger.info("find_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      surveyResponse: {
        attributes: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        measurements: [{ observedAt: req?.filter?.createdAfter }],
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>(
      "acme.surveys.v1.SurveyQueryService/FindSurveys:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyQueryServiceApi.FindSurveysResponse.fromPartial({
      result: { status: (reply1?.outcome?.status ?? "") },
      surveys: [{
        counterparty: { displayName: (reply1?.surveyResponse?.subject?.displayName ?? "") },
      }],
    });
  }

  /**
   * Returns a survey.
   */
  async lookupSurvey(req: surveysSurveyQueryServiceApi.LookupSurveyRequest): Promise<surveysSurveyQueryServiceApi.LookupSurveyResponse> {
    validateContext(req.context);
    if (!req.surveyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupSurvey", req);
    this.logger.info("lookup_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      metricSeries: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.checkMetricSeriesEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse>(invoke1, request1));
    return mergeResponses(
      surveysSurveyQueryServiceApi.LookupSurveyResponse.fromPartial({
        result: { details: (reply1?.result?.details ?? {}) },
        survey: {
          billingAddress: {
            region: ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.region ?? ""),
          },
        },
      }),
      surveysSurveyQueryServiceApi.LookupSurveyResponse.fromPartial({ survey: { surveyId: (req?.surveyId ?? "") } }),
    );
  }

  /**
   * Returns several surveys at once.
   */
  async resolveSurveys(req: surveysSurveyQueryServiceApi.ResolveSurveysRequest): Promise<surveysSurveyQueryServiceApi.ResolveSurveysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveSurveys", req);
    this.logger.info("resolve_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      question: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<surveysQuestionCalculationServiceApi.CalculateQuestionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return surveysSurveyQueryServiceApi.ResolveSurveysResponse.fromPartial({
      surveys: [{ audit: { updatedBy: (reply1?.question?.audit?.updatedBy ?? "") } }],
    });
  }

  /**
   * Lists surveys a page at a time.
   */
  async suggestSurveys(req: surveysSurveyQueryServiceApi.SuggestSurveysRequest): Promise<surveysSurveyQueryServiceApi.SuggestSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestSurveys", req);
    this.logger.info("suggest_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryQueryClient.countWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyQueryServiceApi.SuggestSurveysResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Summarizes a survey.
   */
  async summarizeSurveys(req: surveysSurveyQueryServiceApi.SummarizeSurveysRequest): Promise<surveysSurveyQueryServiceApi.SummarizeSurveysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeSurveys", req);
    this.logger.info("summarize_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.LintQuestionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      question: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse> =
      (input, done) => this.surveysQuestionValidationClient.lintQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: { updatedAt: reply1?.question?.audit?.updatedAt },
        action: { $case: "discount", discount: {
          amount: (reply1?.question?.action?.$case === "discount" ? reply1?.question?.action.discount : undefined)?.amount,
        } },
        owner: { displayName: (reply1?.question?.owner?.displayName ?? "") },
      },
    });
    const method2 = "calculateQuestion" as const;
    const invoke2: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      surveysSurveyQueryServiceApi.SummarizeSurveysResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      surveysSurveyQueryServiceApi.SummarizeSurveysResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      surveysSurveyQueryServiceApi.SummarizeSurveysResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for SurveyQueryService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyQueryHandler {
  constructor(@inject(SurveyQueryWorkflow) private readonly workflow: SurveyQueryWorkflow) {}

  /**
   * Lists surveys a page at a time.
   */
  browseSurveys = unary<surveysSurveyQueryServiceApi.BrowseSurveysRequest, surveysSurveyQueryServiceApi.BrowseSurveysResponse>(
    (request) => this.workflow.browseSurveys(request),
  );

  /**
   * Counts surveys by status.
   */
  countSurveys = unary<surveysSurveyQueryServiceApi.CountSurveysRequest, surveysSurveyQueryServiceApi.CountSurveysResponse>(
    (request) => this.workflow.countSurveys(request),
  );

  /**
   * Lists surveys a page at a time.
   */
  findSurveys = (call: ServerUnaryCall<surveysSurveyQueryServiceApi.FindSurveysRequest, surveysSurveyQueryServiceApi.FindSurveysResponse>, done: sendUnaryData<surveysSurveyQueryServiceApi.FindSurveysResponse>): void => {
    void this.workflow.findSurveys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a survey.
   */
  lookupSurvey = unary<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse>(
    (request) => this.workflow.lookupSurvey(request),
  );

  /**
   * Returns several surveys at once.
   */
  resolveSurveys = unary<surveysSurveyQueryServiceApi.ResolveSurveysRequest, surveysSurveyQueryServiceApi.ResolveSurveysResponse>(
    (request) => this.workflow.resolveSurveys(request),
  );

  /**
   * Lists surveys a page at a time.
   */
  suggestSurveys = (call: ServerUnaryCall<surveysSurveyQueryServiceApi.SuggestSurveysRequest, surveysSurveyQueryServiceApi.SuggestSurveysResponse>, done: sendUnaryData<surveysSurveyQueryServiceApi.SuggestSurveysResponse>): void => {
    void this.workflow.suggestSurveys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a survey.
   */
  summarizeSurveys = unary<surveysSurveyQueryServiceApi.SummarizeSurveysRequest, surveysSurveyQueryServiceApi.SummarizeSurveysResponse>(
    (request) => this.workflow.summarizeSurveys(request),
  );
}

export function implementation(handler: SurveyQueryHandler): surveysSurveyQueryServiceApi.SurveyQueryServiceServer {
  return {
    browseSurveys: handler.browseSurveys,
    countSurveys: handler.countSurveys,
    findSurveys: handler.findSurveys,
    lookupSurvey: handler.lookupSurvey,
    resolveSurveys: handler.resolveSurveys,
    suggestSurveys: handler.suggestSurveys,
    summarizeSurveys: handler.summarizeSurveys,
  };
}
