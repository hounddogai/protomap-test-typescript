/**
 * Checks survey responses against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as yardsYardQueryServiceApi from "../../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSurveyResponseRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey response operations and persist audit data.
 */
@injectable()
export class SurveyResponseValidationWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.yards.v1.YardQueryService") private readonly yardsYardQueryClient: yardsYardQueryServiceApi.YardQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a survey response.
   */
  async checkSurveyResponseEligibility(req: surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest): Promise<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "CheckSurveyResponseEligibility", req);
    this.logger.info("check_survey_response_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.SimulateChatBotRequest.fromPartial({
      chatBot: {
        action: { $case: "block", block: {
          notifyEmail: (req?.surveyResponse?.subject?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        owner: {
          displayName: (req?.surveyResponse?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.SimulateChatBotRequest",
      value: Buffer.from(chatChatBotCalculationServiceApi.SimulateChatBotRequest.encode(request1).finish()),
    });
    const unpacked1 = chatChatBotCalculationServiceApi.SimulateChatBotRequest.decode(envelope1.value);
    const invoke1: Unary<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.simulateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse>(invoke1, unpacked1);
    const settled2 = await Promise.allSettled((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request2 = localizationLocaleQueryServiceApi.FindLocalesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
      });
      const invoke2: Unary<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse> =
        (input, done) => this.localizationLocaleQueryClient.findLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: localizationLocaleQueryServiceApi.FindLocalesResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? localizationLocaleQueryServiceApi.FindLocalesResponse.fromPartial({});
    const request3 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: { audit: { createdBy: (reply1?.chatBot?.audit?.createdBy ?? "") } },
    });
    const client3 = this.clients.get<localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient>("acme.localization.v1.TranslationKeyCalculationService");
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => client3.estimateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        surveyResponse: { subject: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") } },
      }),
      surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse.fromPartial({
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
        surveyResponse: { subject: { email: (reply3?.translationKey?.owner?.email ?? "") } },
      }),
      surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a survey response.
   */
  async explainSurveyResponseDecision(req: surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionRequest): Promise<surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "ExplainSurveyResponseDecision", req);
    this.logger.info("explain_survey_response_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
      featureFlag: { owner: { email: (req?.surveyResponse?.subject?.email ?? "") } },
    });
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.normalizeFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const tasks2: Array<() => Promise<surveysQuestionCalculationServiceApi.EstimateQuestionResponse>> = [];
    for (const item of (req?.surveyResponse?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = surveysQuestionCalculationServiceApi.EstimateQuestionRequest.fromPartial({
          context: req?.context,
          question: {
            audit: {
              createdAt: item?.observedAt,
              updatedBy: (reply1?.featureFlag?.audit?.updatedBy ?? ""),
            },
            owner: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
          },
        });
        const invoke2: Unary<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse> =
          (input, done) => this.surveysQuestionCalculationClient.estimateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? surveysQuestionCalculationServiceApi.EstimateQuestionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionResponse.fromPartial({
        surveyResponse: { subject: { email: (reply1?.featureFlag?.owner?.email ?? "") } },
      }),
      surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionResponse.fromPartial({
        surveyResponse: {
          correlationId: (req?.surveyResponse?.correlationId ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a survey response.
   */
  async getSurveyResponseRules(req: surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesRequest): Promise<surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse> {
    validateContext(req.context);
    if (!req.surveyResponseId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_response_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSurveyResponseRules", req);
    this.logger.info("get_survey_response_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.RecalculateChatBotsRequest.fromPartial({
      chatBot: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse> =
      (input, done) => this.chatChatBotCalculationClient.recalculateChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse>(invoke1, request1));
    const request2 = yardsYardQueryServiceApi.ExportYardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.chatBot?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const stream2 = this.yardsYardQueryClient.exportYards(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? yardsYardQueryServiceApi.ExportYardsResponse.fromPartial({});
    return mergeResponses(
      surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse.fromPartial({ surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") } }),
    );
  }

  /**
   * Normalizes a survey response.
   */
  async normalizeSurveyResponse(req: surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest): Promise<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "NormalizeSurveyResponse", req);
    this.logger.info("normalize_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request1 = personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest.fromPartial({
        context: req?.context,
        details: {
          contact: {
            email: (req?.surveyResponse?.subject?.email ?? ""),
            phone: (req?.details?.contact?.phone ?? ""),
          },
        },
        profile: {
          audit: { createdAt: item?.observedAt },
          relationshipManager: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> =
        (input, done) => this.personalizationProfileValidationClient.explainProfileDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse.fromPartial({});
    const request2 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      question: { audit: { updatedAt: reply1?.profile?.audit?.updatedAt } },
    });
    const invoke2: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("NormalizeSurveyResponse.CalculateQuestion", () => call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke2, request2));
    const request3 = surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { region: (reply1?.profile?.primaryAddress?.region ?? "") },
      },
      question: {
        audit: { updatedBy: (reply1?.profile?.audit?.updatedBy ?? "") },
        action: { $case: "discount", discount: {
          percent: ((reply2?.question?.action?.$case === "discount" ? reply2?.question?.action.discount : undefined)?.percent ?? 0),
        } },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke3: Unary<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse> =
      (input, done) => this.surveysQuestionCalculationClient.compareQuestionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          number: ((reply1?.profile?.identityDocument?.$case === "passport" ? reply1?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
      },
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
    });
    const reply4 = await this.workQueue.enqueue<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse>(
      "acme.surveys.v1.SurveyResponseValidationService/NormalizeSurveyResponse:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse.fromPartial({
        result: { details: (reply3?.result?.details ?? {}) },
        surveyResponse: {
          subject: { displayName: (reply3?.question?.owner?.displayName ?? "") },
        },
      }),
      surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse.fromPartial({
        surveyResponse: {
          sequence: (req?.surveyResponse?.sequence ?? 0),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a survey response.
   */
  async previewSurveyResponse(req: surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest): Promise<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "PreviewSurveyResponse", req);
    this.logger.info("preview_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient.checkChatRoomEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(invoke1, request1));
    const settled2 = await Promise.allSettled((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request2 = metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest.fromPartial({
        context: req?.context,
        metricSeries: { dimensions: { unit: (item?.unit ?? "") } },
      });
      const invoke2: Unary<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse> =
        (input, done) => this.metricsMetricSeriesValidationClient.lintMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<metricsMetricSeriesValidationServiceApi.LintMetricSeriesesRequest, metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? metricsMetricSeriesValidationServiceApi.LintMetricSeriesesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse.fromPartial({
        surveyResponse: {
          source: (req?.surveyResponse?.source ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a survey response.
   */
  async validateSurveyResponse(req: surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseRequest): Promise<surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "ValidateSurveyResponse", req);
    this.logger.info("validate_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>> = [];
    for (const item of (req?.surveyResponse?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.fromPartial({
          context: req?.context,
          question: { audit: { createdAt: item?.observedAt } },
        });
        const invoke1: Unary<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse> =
          (input, done) => this.surveysQuestionCalculationClient.compareQuestionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse.fromPartial({
      result: { correlationId: (req?.surveyResponse?.correlationId ?? "") },
      surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") },
    });
  }
}

/**
 * The gRPC boundary for SurveyResponseValidationService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyResponseValidationHandler {
  constructor(@inject(SurveyResponseValidationWorkflow) private readonly workflow: SurveyResponseValidationWorkflow) {}

  /**
   * Checks a survey response.
   */
  checkSurveyResponseEligibility = unary<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse>(
    (request) => this.workflow.checkSurveyResponseEligibility(request),
  );

  /**
   * Explains a survey response.
   */
  explainSurveyResponseDecision = unary<surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionRequest, surveysSurveyResponseValidationServiceApi.ExplainSurveyResponseDecisionResponse>(
    (request) => this.workflow.explainSurveyResponseDecision(request),
  );

  /**
   * Returns a survey response.
   */
  getSurveyResponseRules = (call: ServerUnaryCall<surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesRequest, surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse>, done: sendUnaryData<surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse>): void => {
    void this.workflow.getSurveyResponseRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a survey response.
   */
  normalizeSurveyResponse = unary<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>(
    (request) => this.workflow.normalizeSurveyResponse(request),
  );

  /**
   * Previews a survey response.
   */
  previewSurveyResponse = unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(
    (request) => this.workflow.previewSurveyResponse(request),
  );

  /**
   * Validates a survey response.
   */
  validateSurveyResponse = (call: ServerUnaryCall<surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse>, done: sendUnaryData<surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse>): void => {
    void this.workflow.validateSurveyResponse(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: SurveyResponseValidationHandler): surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceServer {
  return {
    checkSurveyResponseEligibility: handler.checkSurveyResponseEligibility,
    explainSurveyResponseDecision: handler.explainSurveyResponseDecision,
    getSurveyResponseRules: handler.getSurveyResponseRules,
    normalizeSurveyResponse: handler.normalizeSurveyResponse,
    previewSurveyResponse: handler.previewSurveyResponse,
    validateSurveyResponse: handler.validateSurveyResponse,
  };
}
