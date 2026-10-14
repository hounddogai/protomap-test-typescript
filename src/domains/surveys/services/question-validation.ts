/**
 * Checks questions against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as chatHandoffValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toQuestionRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate question operations and persist audit data.
 */
@injectable()
export class QuestionValidationWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffValidationService") private readonly chatHandoffValidationClient: chatHandoffValidationServiceApi.HandoffValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationAdminService") private readonly notificationsNotificationAdminClient: notificationsNotificationAdminServiceApi.NotificationAdminServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineCalculationService") private readonly pipelinesPipelineCalculationClient: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a question.
   */
  async checkQuestionEligibility(req: surveysQuestionValidationServiceApi.CheckQuestionEligibilityRequest): Promise<surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "CheckQuestionEligibility", req);
    this.logger.info("check_question_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.question?.owner?.email ?? "") } },
      surveyResponse: { subject: { displayName: (req?.question?.owner?.displayName ?? "") } },
    });
    const method1 = "validateSurveyResponse" as const;
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.ValidateSurveyResponseResponse>(invoke1, request1);
    const request2 = chatHandoffValidationServiceApi.LintHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { email: (reply1?.surveyResponse?.subject?.email ?? "") },
        audit: { createdAt: req?.question?.audit?.createdAt },
        requester: {
          email: (req?.question?.owner?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
    });
    const proxy2 = forwarding(this.chatHandoffValidationClient);
    const invoke2: Unary<chatHandoffValidationServiceApi.LintHandoffsRequest, chatHandoffValidationServiceApi.LintHandoffsResponse> =
      (input, done) => proxy2.lintHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffValidationServiceApi.LintHandoffsRequest, chatHandoffValidationServiceApi.LintHandoffsResponse>(invoke2, request2);
    const request3 = chatHandoffValidationServiceApi.ExplainHandoffDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply2?.handoff?.assignee?.email ?? "") } },
      handoff: {
        audit: { updatedAt: req?.question?.audit?.updatedAt },
        requester: { email: (reply1?.surveyResponse?.subject?.email ?? "") },
        sla: { policyId: (reply2?.handoff?.sla?.policyId ?? "") },
      },
    });
    const invoke3: Unary<chatHandoffValidationServiceApi.ExplainHandoffDecisionRequest, chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse> =
      (input, done) => this.chatHandoffValidationClient.explainHandoffDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffValidationServiceApi.ExplainHandoffDecisionRequest, chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse>(invoke3, request3);
    const request4 = surveysQuestionCalculationServiceApi.SimulateQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        owner: {
          displayName: ((reply3?.handoff?.origin?.$case === "customer" ? reply3?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
        action: { $case: "route", route: {
          weight: ((req?.question?.action?.$case === "route" ? req?.question?.action.route : undefined)?.weight ?? 0),
        } },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.simulateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse.fromPartial({
        question: { owner: { email: (reply3?.handoff?.assignee?.email ?? "") } },
      }),
      surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse.fromPartial({ question: { status: reply4?.question?.status } }),
      surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse.fromPartial({
        question: {
          priority: (req?.question?.priority ?? 0),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a question.
   */
  async explainQuestionDecision(req: surveysQuestionValidationServiceApi.ExplainQuestionDecisionRequest): Promise<surveysQuestionValidationServiceApi.ExplainQuestionDecisionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ExplainQuestionDecision", req);
    this.logger.info("explain_question_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsVariantQueryServiceApi.SuggestVariantsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.question?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((input1?.question?.parameters ?? {}))),
        ownerId: (input1?.question?.owner?.userId ?? ""),
      },
    });
    const invoke1: Unary<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.suggestVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled((req?.question?.conditions ?? []).map(async (item) => {
      const request2 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
        context: req?.context,
        question: {
          conditions: [{
            attribute: (item?.attribute ?? ""),
            negate: (item?.negate ?? false),
          }],
        },
      });
      const invoke2: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
        (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: surveysQuestionCalculationServiceApi.CalculateQuestionResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? surveysQuestionCalculationServiceApi.CalculateQuestionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.ExplainQuestionDecisionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysQuestionValidationServiceApi.ExplainQuestionDecisionResponse.fromPartial({
        question: {
          priority: (req?.question?.priority ?? 0),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a question.
   */
  async getQuestionRules(req: surveysQuestionValidationServiceApi.GetQuestionRulesRequest): Promise<surveysQuestionValidationServiceApi.GetQuestionRulesResponse> {
    validateContext(req.context);
    if (!req.questionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "question_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetQuestionRules", req);
    this.logger.info("get_question_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = pipelinesPipelineCalculationServiceApi.CalculatePipelineRequest.fromPartial({
      context: req?.context,
      pipeline: {
        organizer: { userId: (req?.context?.actor?.userId ?? "") },
        participants: [{
          contact: { email: (req?.context?.actor?.email ?? "") },
          participantId: (req?.questionId ?? ""),
        }],
      },
    });
    const cloned1: pipelinesPipelineCalculationServiceApi.CalculatePipelineRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<pipelinesPipelineCalculationServiceApi.CalculatePipelineRequest, pipelinesPipelineCalculationServiceApi.CalculatePipelineResponse> =
      (input, done) => this.pipelinesPipelineCalculationClient.calculatePipeline(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<pipelinesPipelineCalculationServiceApi.CalculatePipelineRequest, pipelinesPipelineCalculationServiceApi.CalculatePipelineResponse>(invoke1, cloned1);
    const request2 = surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply1?.pipeline?.location?.countryCode ?? "") },
      },
      question: {
        audit: { createdBy: (reply1?.pipeline?.audit?.createdBy ?? "") },
        owner: { email: (reply1?.pipeline?.organizer?.email ?? "") },
      },
    });
    const decoded2 = surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.toJSON(request2))),
    );
    const invoke2: Unary<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse> =
      (input, done) => this.surveysQuestionCalculationClient.recalculateQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>(invoke2, decoded2);
    return mergeResponses(
      surveysQuestionValidationServiceApi.GetQuestionRulesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysQuestionValidationServiceApi.GetQuestionRulesResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      surveysQuestionValidationServiceApi.GetQuestionRulesResponse.fromPartial({ question: { questionId: (req?.questionId ?? "") } }),
    );
  }

  /**
   * Lints a question.
   */
  async lintQuestions(req: surveysQuestionValidationServiceApi.LintQuestionsRequest): Promise<surveysQuestionValidationServiceApi.LintQuestionsResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "LintQuestions", req);
    this.logger.info("lint_questions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.EstimateQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        action: { $case: "block", block: {
          reason: ((req?.question?.action?.$case === "block" ? req?.question?.action.block : undefined)?.reason ?? ""),
        } },
        owner: { email: (req?.question?.owner?.email ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.EstimateQuestionRequest",
      value: Buffer.from(surveysQuestionCalculationServiceApi.EstimateQuestionRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysQuestionCalculationServiceApi.EstimateQuestionRequest.decode(envelope1.value);
    const invoke1: Unary<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.estimateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse>(invoke1, unpacked1);
    const request2 = personalizationProfileValidationServiceApi.LintProfilesRequest.fromPartial({
      context: req?.context,
      profile: {
        relationshipManager: {
          email: (reply1?.question?.owner?.email ?? ""),
          userId: (req?.question?.owner?.userId ?? ""),
        },
      },
    });
    const client2 = this.clients.get<personalizationProfileValidationServiceApi.ProfileValidationServiceClient>("acme.personalization.v1.ProfileValidationService");
    const invoke2: Unary<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse> =
      (input, done) => client2.lintProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.LintQuestionsResponse.fromPartial({ question: { audit: { etag: (reply1?.question?.audit?.etag ?? "") } } }),
      surveysQuestionValidationServiceApi.LintQuestionsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      surveysQuestionValidationServiceApi.LintQuestionsResponse.fromPartial({
        question: {
          effective: req?.question?.effective,
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a question.
   */
  async normalizeQuestion(req: surveysQuestionValidationServiceApi.NormalizeQuestionRequest): Promise<surveysQuestionValidationServiceApi.NormalizeQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "NormalizeQuestion", req);
    this.logger.info("normalize_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      webhookEndpoint: {
        audit: {
          createdBy: (req?.question?.audit?.createdBy ?? ""),
          updatedBy: (req?.question?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (req?.question?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.previewWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const invoke2: Unary<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.checkSurveyResponseEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse>(invoke2, request2));
    let selected3_4: string | undefined;
    switch (reply1?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected3_4 = ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected3_4 = "";
    }
    const request3 = surveysQuestionCalculationServiceApi.EstimateQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected3_4 ?? "") } },
      question: {
        audit: {
          createdAt: req?.question?.audit?.createdAt,
          updatedBy: (req?.question?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (reply2?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.estimateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse>(invoke3, request3);
    const request4 = webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply3?.question?.owner?.email ?? "") } },
      webhookEndpoint: {
        dimensions: { width: (reply1?.webhookEndpoint?.dimensions?.width ?? 0) },
        owner: { displayName: (reply2?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke4: Unary<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.normalizeWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({
        outcome: {
          message: (reply2?.outcome?.message ?? ""),
          referenceId: (reply2?.outcome?.referenceId ?? ""),
        },
      }),
      surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({ question: { questionId: (reply3?.question?.questionId ?? "") } }),
      surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      surveysQuestionValidationServiceApi.NormalizeQuestionResponse.fromPartial({
        question: {
          effective: req?.question?.effective,
          status: req?.question?.status,
        },
      }),
    );
  }

  /**
   * Previews a question.
   */
  async previewQuestion(req: surveysQuestionValidationServiceApi.PreviewQuestionRequest): Promise<surveysQuestionValidationServiceApi.PreviewQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "PreviewQuestion", req);
    this.logger.info("preview_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.CalculateVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        description: (req?.question?.description ?? ""),
        owner: { userId: (req?.question?.owner?.userId ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>(
      "acme.surveys.v1.QuestionValidationService/PreviewQuestion:0", request1,
    );
    let selected2_2: number | undefined;
    switch (req?.question?.action?.$case) {
      case "route":
        selected2_2 = ((req?.question?.action?.$case === "route" ? req?.question?.action.route : undefined)?.weight ?? 0);
        break;
      default:
        selected2_2 = 0;
    }
    const request2 = surveysQuestionCalculationServiceApi.ExplainQuestionCalculationRequest.fromPartial({
      context: req?.context,
      question: {
        audit: { updatedBy: (req?.question?.audit?.updatedBy ?? "") },
        owner: { userId: (reply1?.variant?.owner?.userId ?? "") },
        action: { $case: "route", route: { weight: (selected2_2 ?? 0) } },
      },
    });
    const invoke2: Unary<surveysQuestionCalculationServiceApi.ExplainQuestionCalculationRequest, surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse> =
      (input, done) => this.surveysQuestionCalculationClient.explainQuestionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionCalculationServiceApi.ExplainQuestionCalculationRequest, surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse>(invoke2, request2);
    const request3 = notificationsNotificationAdminServiceApi.RepairNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { email: (req?.details?.contact?.email ?? "") },
        requester: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke3: Unary<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse> =
      (input, done) => this.notificationsNotificationAdminClient.repairNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<notificationsNotificationAdminServiceApi.RepairNotificationResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.contact?.phone ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.PreviewQuestionResponse.fromPartial({
        question: {
          description: (reply1?.variant?.description ?? ""),
          version: (reply1?.variant?.version ?? 0),
        },
      }),
      surveysQuestionValidationServiceApi.PreviewQuestionResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        question: { parameters: (reply2?.question?.parameters ?? {}) },
      }),
      surveysQuestionValidationServiceApi.PreviewQuestionResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      surveysQuestionValidationServiceApi.PreviewQuestionResponse.fromPartial({
        question: {
          name: (req?.question?.name ?? ""),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a question.
   */
  async scoreQuestion(req: surveysQuestionValidationServiceApi.ScoreQuestionRequest): Promise<surveysQuestionValidationServiceApi.ScoreQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ScoreQuestion", req);
    this.logger.info("score_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.ScoreQuestionResponse.fromPartial({
        question: {
          description: (reply1?.searchIndex?.components?.["primary"]?.description ?? ""),
        },
      }),
      surveysQuestionValidationServiceApi.ScoreQuestionResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        question: { questionId: (req?.questionId ?? "") },
      }),
    );
  }

  /**
   * Validates a question.
   */
  async validateQuestion(req: surveysQuestionValidationServiceApi.ValidateQuestionRequest): Promise<surveysQuestionValidationServiceApi.ValidateQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ValidateQuestion", req);
    this.logger.info("validate_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.GetQuestionRatesRequest.fromPartial({
      context: req?.context,
      questionId: (req?.question?.questionId ?? ""),
    });
    const invoke1: Unary<surveysQuestionCalculationServiceApi.GetQuestionRatesRequest, surveysQuestionCalculationServiceApi.GetQuestionRatesResponse> =
      (input, done) => this.surveysQuestionCalculationClient.getQuestionRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionValidationServiceApi.ValidateQuestionResponse.fromPartial({
        question: {
          owner: { displayName: (reply1?.question?.owner?.displayName ?? "") },
          parameters: (reply1?.question?.parameters ?? {}),
        },
      }),
      surveysQuestionValidationServiceApi.ValidateQuestionResponse.fromPartial({
        question: {
          priority: (req?.question?.priority ?? 0),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for QuestionValidationService; workflows own validation and database transactions.
 */
@injectable()
export class QuestionValidationHandler {
  constructor(@inject(QuestionValidationWorkflow) private readonly workflow: QuestionValidationWorkflow) {}

  /**
   * Checks a question.
   */
  checkQuestionEligibility = unary<surveysQuestionValidationServiceApi.CheckQuestionEligibilityRequest, surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse>(
    (request) => this.workflow.checkQuestionEligibility(request),
  );

  /**
   * Explains a question.
   */
  explainQuestionDecision = unary<surveysQuestionValidationServiceApi.ExplainQuestionDecisionRequest, surveysQuestionValidationServiceApi.ExplainQuestionDecisionResponse>(
    (request) => this.workflow.explainQuestionDecision(request),
  );

  /**
   * Returns a question.
   */
  getQuestionRules = (call: ServerUnaryCall<surveysQuestionValidationServiceApi.GetQuestionRulesRequest, surveysQuestionValidationServiceApi.GetQuestionRulesResponse>, done: sendUnaryData<surveysQuestionValidationServiceApi.GetQuestionRulesResponse>): void => {
    void this.workflow.getQuestionRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a question.
   */
  lintQuestions = unary<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse>(
    (request) => this.workflow.lintQuestions(request),
  );

  /**
   * Normalizes a question.
   */
  normalizeQuestion = unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse>(
    (request) => this.workflow.normalizeQuestion(request),
  );

  /**
   * Previews a question.
   */
  previewQuestion = (call: ServerUnaryCall<surveysQuestionValidationServiceApi.PreviewQuestionRequest, surveysQuestionValidationServiceApi.PreviewQuestionResponse>, done: sendUnaryData<surveysQuestionValidationServiceApi.PreviewQuestionResponse>): void => {
    void this.workflow.previewQuestion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a question.
   */
  scoreQuestion = unary<surveysQuestionValidationServiceApi.ScoreQuestionRequest, surveysQuestionValidationServiceApi.ScoreQuestionResponse>(
    (request) => this.workflow.scoreQuestion(request),
  );

  /**
   * Validates a question.
   */
  validateQuestion = unary<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse>(
    (request) => this.workflow.validateQuestion(request),
  );
}

export function implementation(handler: QuestionValidationHandler): surveysQuestionValidationServiceApi.QuestionValidationServiceServer {
  return {
    checkQuestionEligibility: handler.checkQuestionEligibility,
    explainQuestionDecision: handler.explainQuestionDecision,
    getQuestionRules: handler.getQuestionRules,
    lintQuestions: handler.lintQuestions,
    normalizeQuestion: handler.normalizeQuestion,
    previewQuestion: handler.previewQuestion,
    scoreQuestion: handler.scoreQuestion,
    validateQuestion: handler.validateQuestion,
  };
}
