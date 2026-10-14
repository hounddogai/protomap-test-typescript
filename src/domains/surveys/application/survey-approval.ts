/**
 * Routes surveys through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import * as subscriptionsSubscriptionQueryServiceApi from "../../../../.cache/proto/acme/subscriptions/v1/subscription_query_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as telematicsTelemetryReadingServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSurveyRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey operations and persist audit data.
 */
@injectable()
export class SurveyApprovalWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.localization.v1.LocaleWorkflowService") private readonly localizationLocaleWorkflowClient: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.seating.v1.SeatMapQueryService") private readonly seatingSeatMapQueryClient: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient,
    @inject("grpc:acme.subscriptions.v1.SubscriptionQueryService") private readonly subscriptionsSubscriptionQueryClient: subscriptionsSubscriptionQueryServiceApi.SubscriptionQueryServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyQueryService") private readonly surveysSurveyQueryClient: surveysSurveyQueryServiceApi.SurveyQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingService") private readonly telematicsTelemetryReadingClient: telematicsTelemetryReadingServiceApi.TelemetryReadingServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a survey.
   */
  async approveSurvey(req: surveysSurveyApprovalServiceApi.ApproveSurveyRequest): Promise<surveysSurveyApprovalServiceApi.ApproveSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "ApproveSurvey", req);
    this.logger.info("approve_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = seatingSeatMapQueryServiceApi.BrowseSeatMapsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.survey?.metadata ?? {}))),
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<seatingSeatMapQueryServiceApi.BrowseSeatMapsRequest, seatingSeatMapQueryServiceApi.BrowseSeatMapsResponse> =
      (input, done) => this.seatingSeatMapQueryClient.browseSeatMaps(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<seatingSeatMapQueryServiceApi.BrowseSeatMapsRequest, seatingSeatMapQueryServiceApi.BrowseSeatMapsResponse>(invoke1, request1));
    const request2 = localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          createdAt: req?.survey?.audit?.createdAt,
          createdBy: (req?.survey?.audit?.createdBy ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse> =
      (input, done) => this.localizationLocaleWorkflowClient.retryLocaleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ApproveSurvey.RetryLocaleWorkflow", () => call<localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.ApproveSurveyResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyApprovalServiceApi.ApproveSurveyResponse.fromPartial({
        survey: {
          counterparty: {
            displayName: (reply2?.locale?.owner?.displayName ?? ""),
            version: (reply2?.locale?.version ?? 0),
          },
        },
      }),
      surveysSurveyApprovalServiceApi.ApproveSurveyResponse.fromPartial({
        survey: {
          issuedAt: req?.survey?.issuedAt,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a survey.
   */
  async commentSurveyApproval(req: surveysSurveyApprovalServiceApi.CommentSurveyApprovalRequest): Promise<surveysSurveyApprovalServiceApi.CommentSurveyApprovalResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "CommentSurveyApproval", req);
    this.logger.info("comment_survey_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: { createdAt: req?.survey?.audit?.createdAt },
        owner: { displayName: (req?.survey?.counterparty?.displayName ?? "") },
      },
    });
    const invoke1: Unary<localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse> =
      (input, done) => this.localizationLocaleWorkflowClient.advanceLocaleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: {
          createdAt: req?.survey?.audit?.createdAt,
          etag: (reply1?.locale?.audit?.etag ?? ""),
        },
        primaryAddress: { recipient: (req?.survey?.billingAddress?.recipient ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>(
      "acme.surveys.v1.SurveyApprovalService/CommentSurveyApproval:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.CommentSurveyApprovalResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      surveysSurveyApprovalServiceApi.CommentSurveyApprovalResponse.fromPartial({
        survey: { audit: { updatedBy: (reply2?.customer?.audit?.updatedBy ?? "") } },
      }),
      surveysSurveyApprovalServiceApi.CommentSurveyApprovalResponse.fromPartial({
        survey: {
          billingAddress: req?.survey?.billingAddress,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a survey.
   */
  async delegateSurveyApproval(req: surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest): Promise<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "DelegateSurveyApproval", req);
    this.logger.info("delegate_survey_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.dueAt,
        labels: Object.fromEntries(Object.entries((req?.survey?.metadata ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.countSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse>(invoke1, request1));
    const request2 = telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.createdAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
      subscriber: { email: (req?.details?.approver?.email ?? "") },
    });
    const stream2 = this.telematicsTelemetryReadingClient.watchTelemetryReadings(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsResponse.fromPartial({});
    const request3 = surveysQuestionCalculationServiceApi.EstimateQuestionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: (req?.survey?.billingAddress?.recipient ?? ""),
          region: (req?.survey?.billingAddress?.region ?? ""),
        },
      },
      question: {
        audit: { createdAt: req?.survey?.audit?.createdAt },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const invoke3: Unary<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.estimateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<surveysQuestionCalculationServiceApi.EstimateQuestionResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: { updatedAt: req?.survey?.audit?.updatedAt },
        owner: { displayName: (req?.survey?.counterparty?.displayName ?? "") },
        action: { $case: "route", route: {
          target: ((reply3?.question?.action?.$case === "route" ? reply3?.question?.action.route : undefined)?.target ?? ""),
        } },
      },
    });
    const invoke4: Unary<featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CloneFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.cloneFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse.fromPartial({ survey: { audit: { etag: (reply3?.question?.audit?.etag ?? "") } } }),
      surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse.fromPartial({
        survey: { audit: { createdBy: (reply4?.featureFlag?.audit?.createdBy ?? "") } },
      }),
      surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        survey: { surveyId: (req?.surveyId ?? "") },
      }),
    );
  }

  /**
   * Escalates a survey.
   */
  async escalateSurvey(req: surveysSurveyApprovalServiceApi.EscalateSurveyRequest): Promise<surveysSurveyApprovalServiceApi.EscalateSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "EscalateSurvey", req);
    this.logger.info("escalate_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.CheckQuestionEligibilityRequest.fromPartial({
      context: req?.context,
      question: { version: (req?.survey?.counterparty?.version ?? 0) },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.CheckQuestionEligibilityRequest, surveysQuestionValidationServiceApi.CheckQuestionEligibilityResponse> =
      (input, done) => this.surveysQuestionValidationClient.checkQuestionEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.EscalateSurveyResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      surveysSurveyApprovalServiceApi.EscalateSurveyResponse.fromPartial({
        survey: {
          notes: (req?.survey?.notes ?? ""),
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a survey.
   */
  async getSurveyApprovalStatus(req: surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusRequest): Promise<surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.surveyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSurveyApprovalStatus", req);
    this.logger.info("get_survey_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = subscriptionsSubscriptionQueryServiceApi.ResolveSubscriptionsRequest.fromPartial({ context: req?.context });
    const method1 = "resolveSubscriptions" as const;
    const invoke1: Unary<subscriptionsSubscriptionQueryServiceApi.ResolveSubscriptionsRequest, subscriptionsSubscriptionQueryServiceApi.ResolveSubscriptionsResponse> =
      (input, done) => this.subscriptionsSubscriptionQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<subscriptionsSubscriptionQueryServiceApi.ResolveSubscriptionsRequest, subscriptionsSubscriptionQueryServiceApi.ResolveSubscriptionsResponse>(invoke1, request1);
    const request2 = personalizationAffinitySyncServiceApi.SyncAffinitiesRequest.fromPartial({
      affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
      context: req?.context,
    });
    const proxy2 = forwarding(this.personalizationAffinitySyncClient);
    const invoke2: Unary<personalizationAffinitySyncServiceApi.SyncAffinitiesRequest, personalizationAffinitySyncServiceApi.SyncAffinitiesResponse> =
      (input, done) => proxy2.syncAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinitySyncServiceApi.SyncAffinitiesRequest, personalizationAffinitySyncServiceApi.SyncAffinitiesResponse>(invoke2, request2);
    return mergeResponses(
      surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        survey: { number: (reply2?.affinity?.subject?.number ?? "") },
      }),
      surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusResponse.fromPartial({ survey: { surveyId: (req?.surveyId ?? "") } }),
    );
  }

  /**
   * Lists surveys a page at a time.
   */
  async listPendingSurveys(req: surveysSurveyApprovalServiceApi.ListPendingSurveysRequest): Promise<surveysSurveyApprovalServiceApi.ListPendingSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingSurveys", req);
    this.logger.info("list_pending_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.LintQuestionsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse> =
      (input, done) => this.surveysQuestionValidationClient.lintQuestions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionValidationServiceApi.LintQuestionsRequest, surveysQuestionValidationServiceApi.LintQuestionsResponse>(invoke1, request1);
    const request2 = surveysQuestionValidationServiceApi.NormalizeQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: {
          createdBy: (reply1?.question?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.question?.audit?.updatedBy ?? ""),
        },
        action: { $case: "block", block: {
          reason: ((reply1?.question?.action?.$case === "block" ? reply1?.question?.action.block : undefined)?.reason ?? ""),
        } },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.normalizeQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.ListPendingSurveysResponse.fromPartial({ surveys: [{ audit: { etag: (reply1?.question?.audit?.etag ?? "") } }] }),
      surveysSurveyApprovalServiceApi.ListPendingSurveysResponse.fromPartial({
        surveys: [{
          lines: [{
            tax: {
              amount: (reply2?.question?.action?.$case === "discount" ? reply2?.question?.action.discount : undefined)?.amount,
            },
          }],
        }],
      }),
    );
  }

  /**
   * Recalls a survey.
   */
  async recallSurvey(req: surveysSurveyApprovalServiceApi.RecallSurveyRequest): Promise<surveysSurveyApprovalServiceApi.RecallSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "RecallSurvey", req);
    this.logger.info("recall_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = customersCustomerValidationServiceApi.PreviewCustomerRequest.fromPartial({
      context: input1?.context,
      details: { contact: { email: (input1?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<customersCustomerValidationServiceApi.PreviewCustomerRequest, customersCustomerValidationServiceApi.PreviewCustomerResponse> =
      (input, done) => this.customersCustomerValidationClient.previewCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerValidationServiceApi.PreviewCustomerRequest, customersCustomerValidationServiceApi.PreviewCustomerResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.RecallSurveyResponse.fromPartial({
        survey: {
          audit: { createdAt: reply1?.customer?.audit?.createdAt },
          billingAddress: { recipient: (reply1?.customer?.primaryAddress?.recipient ?? "") },
        },
      }),
      surveysSurveyApprovalServiceApi.RecallSurveyResponse.fromPartial({
        survey: {
          issuedAt: req?.survey?.issuedAt,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a survey.
   */
  async rejectSurvey(req: surveysSurveyApprovalServiceApi.RejectSurveyRequest): Promise<surveysSurveyApprovalServiceApi.RejectSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "RejectSurvey", req);
    this.logger.info("reject_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.updatedAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const cloned1: surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.suggestSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse>(invoke1, cloned1);
    const request2 = auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.fromPartial({
      auditEvent: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const decoded2 = auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.fromJSON(
      JSON.parse(JSON.stringify(auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.toJSON(request2))),
    );
    const invoke2: Unary<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.normalizeAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse>(invoke2, decoded2);
    const request3 = surveysQuestionValidationServiceApi.PreviewQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: {
          createdBy: (req?.survey?.audit?.createdBy ?? ""),
          etag: (req?.survey?.audit?.etag ?? ""),
        },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.PreviewQuestionRequest",
      value: Buffer.from(surveysQuestionValidationServiceApi.PreviewQuestionRequest.encode(request3).finish()),
    });
    const unpacked3 = surveysQuestionValidationServiceApi.PreviewQuestionRequest.decode(envelope3.value);
    const invoke3: Unary<surveysQuestionValidationServiceApi.PreviewQuestionRequest, surveysQuestionValidationServiceApi.PreviewQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.previewQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<surveysQuestionValidationServiceApi.PreviewQuestionRequest, surveysQuestionValidationServiceApi.PreviewQuestionResponse>(invoke3, unpacked3);
    const request4 = surveysSurveyQueryServiceApi.CountSurveysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.updatedAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const client4 = this.clients.get<surveysSurveyQueryServiceApi.SurveyQueryServiceClient>("acme.surveys.v1.SurveyQueryService");
    const invoke4: Unary<surveysSurveyQueryServiceApi.CountSurveysRequest, surveysSurveyQueryServiceApi.CountSurveysResponse> =
      (input, done) => client4.countSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<surveysSurveyQueryServiceApi.CountSurveysRequest, surveysSurveyQueryServiceApi.CountSurveysResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.RejectSurveyResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      surveysSurveyApprovalServiceApi.RejectSurveyResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      surveysSurveyApprovalServiceApi.RejectSurveyResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        survey: {
          lines: [{
            tax: {
              amount: (reply3?.question?.action?.$case === "discount" ? reply3?.question?.action.discount : undefined)?.amount,
            },
          }],
        },
      }),
      surveysSurveyApprovalServiceApi.RejectSurveyResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      surveysSurveyApprovalServiceApi.RejectSurveyResponse.fromPartial({
        survey: {
          issuedAt: req?.survey?.issuedAt,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a survey.
   */
  async submitSurvey(req: surveysSurveyApprovalServiceApi.SubmitSurveyRequest): Promise<surveysSurveyApprovalServiceApi.SubmitSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "SubmitSurvey", req);
    this.logger.info("submit_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: { postalCode: (req?.survey?.billingAddress?.postalCode ?? "") } },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.approveWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = customersPreferenceValidationServiceApi.NormalizePreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        audit: {
          createdAt: req?.survey?.audit?.createdAt,
          updatedAt: req?.survey?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.normalizePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse>(invoke2, request2));
    const request3 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "discount", discount: { amount: req?.survey?.total } },
        parameters: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyApprovalServiceApi.SubmitSurveyResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      surveysSurveyApprovalServiceApi.SubmitSurveyResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      surveysSurveyApprovalServiceApi.SubmitSurveyResponse.fromPartial({
        survey: {
          issuedAt: req?.survey?.issuedAt,
          surveyId: (req?.surveyId ?? ""),
        },
      }),
    );
  }
}
