/**
 * Runs the long-lived workflow that takes a survey response from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
import { toSurveyResponseRecord } from "../../data/records.js";
import { SurveysRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey response operations and persist audit data.
 */
@injectable()
export class SurveyResponseWorkflowWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("grpc:acme.suppliers.v1.SupplierQueryService") private readonly suppliersSupplierQueryClient: suppliersSupplierQueryServiceApi.SupplierQueryServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionApprovalService") private readonly surveysQuestionApprovalClient: surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyApprovalService") private readonly surveysSurveyApprovalClient: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a survey response.
   */
  async advanceSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "AdvanceSurveyResponseWorkflow", req);
    this.logger.info("advance_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureSyncServiceApi.ReconcileExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient.reconcileExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExposureSyncServiceApi.ReconcileExposuresResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const results2 = await Promise.all((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request2 = customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest.fromPartial({
        context: req?.context,
        customerSegment: {
          audit: { updatedAt: item?.observedAt },
          owner: {
            displayName: (req?.surveyResponse?.subject?.displayName ?? ""),
            email: (req?.surveyResponse?.subject?.email ?? ""),
          },
        },
      });
      const invoke2: Unary<customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse> =
        (input, done) => this.customersCustomerSegmentValidationClient.validateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse.fromPartial({});
    const request3 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        kind: (req?.surveyResponse?.kind ?? ""),
        occurredAt: req?.surveyResponse?.occurredAt,
        source: (req?.surveyResponse?.source ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a survey response.
   */
  async cancelSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "CancelSurveyResponseWorkflow", req);
    this.logger.info("cancel_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = suppliersSupplierQueryServiceApi.ResolveSuppliersRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<suppliersSupplierQueryServiceApi.ResolveSuppliersRequest, suppliersSupplierQueryServiceApi.ResolveSuppliersResponse> =
      (input, done) => this.suppliersSupplierQueryClient.resolveSuppliers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
      notificationTemplate: {
        counterparty: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.surveyResponse?.attributes ?? {}))),
        }],
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest, notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.explainNotificationTemplateDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse.fromPartial({
        result: { correlationId: (req?.surveyResponse?.correlationId ?? "") },
        surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") },
      }),
    );
  }

  /**
   * Returns a survey response.
   */
  async inspectSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (!req.surveyResponseId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_response_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectSurveyResponseWorkflow", req);
    this.logger.info("inspect_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      surveyResponseId: (req?.surveyResponseId ?? ""),
    });
    const method1 = "previewSurveyResponse" as const;
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(invoke1, request1);
    const request2 = surveysSurveyApprovalServiceApi.ListPendingSurveysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.surveyResponse?.occurredAt,
        ownerId: (reply1?.surveyResponse?.subject?.customerId ?? ""),
      },
    });
    const proxy2 = forwarding(this.surveysSurveyApprovalClient);
    const invoke2: Unary<surveysSurveyApprovalServiceApi.ListPendingSurveysRequest, surveysSurveyApprovalServiceApi.ListPendingSurveysResponse> =
      (input, done) => proxy2.listPendingSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyApprovalServiceApi.ListPendingSurveysRequest, surveysSurveyApprovalServiceApi.ListPendingSurveysResponse>(invoke2, request2);
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse.fromPartial({ surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") } }),
    );
  }

  /**
   * Lists survey responses a page at a time.
   */
  async listSurveyResponseWorkflows(req: surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsRequest): Promise<surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSurveyResponseWorkflows", req);
    this.logger.info("list_survey_response_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.EstimateCustomerRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.estimateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse>(invoke1, request1);
    const request2 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: { audit: { etag: (reply1?.customer?.audit?.etag ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsResponse.fromPartial({
        surveyResponses: [{ subject: { customerId: (reply1?.customer?.customerId ?? "") } }],
      }),
      surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsResponse.fromPartial({
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
        surveyResponses: [{ subject: { email: (reply2?.preference?.owner?.email ?? "") } }],
      }),
    );
  }

  /**
   * Pauses a survey response.
   */
  async pauseSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "PauseSurveyResponseWorkflow", req);
    this.logger.info("pause_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request1 = surveysQuestionApprovalServiceApi.ApproveQuestionRequest.fromPartial({
        context: req?.context,
        question: { audit: { updatedAt: item?.observedAt } },
      });
      const invoke1: Unary<surveysQuestionApprovalServiceApi.ApproveQuestionRequest, surveysQuestionApprovalServiceApi.ApproveQuestionResponse> =
        (input, done) => this.surveysQuestionApprovalClient.approveQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<surveysQuestionApprovalServiceApi.ApproveQuestionRequest, surveysQuestionApprovalServiceApi.ApproveQuestionResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: surveysQuestionApprovalServiceApi.ApproveQuestionResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? surveysQuestionApprovalServiceApi.ApproveQuestionResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = surveysSurveyApprovalServiceApi.EscalateSurveyRequest.fromPartial({
      context: input2?.context,
      details: { approver: { email: (reply1?.question?.owner?.email ?? "") } },
      survey: {
        audit: { etag: (reply1?.question?.audit?.etag ?? "") },
        counterparty: { displayName: (reply1?.question?.owner?.displayName ?? "") },
        lines: [{ description: (reply1?.question?.description ?? "") }],
      },
    });
    const invoke2: Unary<surveysSurveyApprovalServiceApi.EscalateSurveyRequest, surveysSurveyApprovalServiceApi.EscalateSurveyResponse> =
      (input, done) => this.surveysSurveyApprovalClient.escalateSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyApprovalServiceApi.EscalateSurveyRequest, surveysSurveyApprovalServiceApi.EscalateSurveyResponse>(invoke2, request2);
    const request3 = experimentsExposureSyncServiceApi.PushExposureRequest.fromPartial({
      context: req?.context,
      exposure: {
        attributes: Object.fromEntries(Object.entries((req?.surveyResponse?.attributes ?? {}))),
        kind: (req?.surveyResponse?.kind ?? ""),
        occurredAt: req?.surveyResponse?.occurredAt,
        subject: { displayName: (reply2?.survey?.counterparty?.displayName ?? "") },
      },
    });
    const cloned3: experimentsExposureSyncServiceApi.PushExposureRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse> =
      (input, done) => this.experimentsExposureSyncClient.pushExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse.fromPartial({ outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a survey response.
   */
  async resumeSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "ResumeSurveyResponseWorkflow", req);
    this.logger.info("resume_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      consentRecord: {
        attributes: Object.fromEntries(Object.entries((req?.surveyResponse?.attributes ?? {}))),
        kind: (req?.surveyResponse?.kind ?? ""),
        occurredAt: req?.surveyResponse?.occurredAt,
        subject: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const decoded1 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromJSON(
      JSON.parse(JSON.stringify(customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.toJSON(request1))),
    );
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse>(invoke1, decoded1);
    const request2 = surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
      surveyResponse: {
        subject: {
          displayName: (req?.surveyResponse?.subject?.displayName ?? ""),
          email: (req?.surveyResponse?.subject?.email ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.NormalizeSurveyResponseRequest",
      value: Buffer.from(surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.encode(request2).finish()),
    });
    const unpacked2 = surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.decode(envelope2.value);
    const invoke2: Unary<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.normalizeSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>(invoke2, unpacked2);
    const request3 = communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: { displayName: (reply2?.surveyResponse?.subject?.displayName ?? "") },
          }],
        }],
      },
    });
    const client3 = this.clients.get<communityForumApprovalServiceApi.ForumApprovalServiceClient>("acme.community.v1.ForumApprovalService");
    const invoke3: Unary<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse> =
      (input, done) => client3.submitForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(invoke3, request3);
    const request4 = surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply3?.forum?.manager?.displayName ?? "") },
      },
      survey: {
        audit: { createdAt: reply3?.forum?.audit?.createdAt },
        billingAddress: {
          lines: (reply3?.forum?.location?.lines ?? []).map((value) => value),
          postalCode: (reply3?.forum?.location?.postalCode ?? ""),
        },
      },
    });
    const invoke4: Unary<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest, surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse> =
      (input, done) => this.surveysSurveyApprovalClient.delegateSurveyApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest, surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: { subject: { email: (reply2?.surveyResponse?.subject?.email ?? "") } },
      }),
      surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          message: (reply4?.outcome?.message ?? ""),
        },
      }),
      surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          kind: (req?.surveyResponse?.kind ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a survey response.
   */
  async retrySurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "RetrySurveyResponseWorkflow", req);
    this.logger.info("retry_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.resolveSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.surveyResponse?.subject?.email ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    const tasks3: Array<() => Promise<surveysQuestionCalculationServiceApi.CalculateQuestionResponse>> = [];
    for (const item of (req?.surveyResponse?.measurements ?? [])) {
      tasks3.push(async () => {
        const request3 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
          context: req?.context,
          question: {
            audit: { createdAt: item?.observedAt },
            owner: {
              displayName: (req?.surveyResponse?.subject?.displayName ?? ""),
              email: (req?.details?.notify?.email ?? ""),
            },
            parameters: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
          },
        });
        const invoke3: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
          (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? surveysQuestionCalculationServiceApi.CalculateQuestionResponse.fromPartial({});
    const request4 = surveysSurveyApprovalServiceApi.ApproveSurveyRequest.fromPartial({
      context: req?.context,
      survey: { audit: { etag: (reply3?.question?.audit?.etag ?? "") } },
    });
    const invoke4: Unary<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse> =
      (input, done) => this.surveysSurveyApprovalClient.approveSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("RetrySurveyResponseWorkflow.ApproveSurvey", () => call<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        result: { message: (reply4?.outcome?.message ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          source: (req?.surveyResponse?.source ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a survey response.
   */
  async signalSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "SignalSurveyResponseWorkflow", req);
    this.logger.info("signal_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request1 = customersCustomerQueryServiceApi.BrowseCustomersRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((req?.surveyResponse?.attributes ?? {}))),
          ownerId: (req?.surveyResponse?.subject?.customerId ?? ""),
        },
      });
      const invoke1: Unary<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse> =
        (input, done) => this.customersCustomerQueryClient.browseCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? customersCustomerQueryServiceApi.BrowseCustomersResponse.fromPartial({});
    const request2 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const settled3 = await Promise.allSettled((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request3 = surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest.fromPartial({
        context: req?.context,
        surveyResponse: {
          measurements: [{
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
      });
      const invoke3: Unary<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse> =
        (input, done) => this.surveysSurveyResponseApprovalClient.recallSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          correlationId: (req?.surveyResponse?.correlationId ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a survey response.
   */
  async startSurveyResponseWorkflow(req: surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest): Promise<surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "StartSurveyResponseWorkflow", req);
    this.logger.info("start_survey_response_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionApprovalServiceApi.RecallQuestionRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.surveyResponse?.subject?.email ?? "") } },
      question: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse>(
      "acme.surveys.v1.SurveyResponseWorkflowService/StartSurveyResponseWorkflow:0", request1,
    );
    const request2 = searchSearchIndexServiceApi.SearchSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.question?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<searchSearchIndexServiceApi.SearchSearchIndexesRequest, searchSearchIndexServiceApi.SearchSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexClient.searchSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<searchSearchIndexServiceApi.SearchSearchIndexesRequest, searchSearchIndexServiceApi.SearchSearchIndexesResponse>(invoke2, request2));
    const request3 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
      surveyResponse: {
        subject: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.previewSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse.fromPartial({
        result: { message: (reply3?.outcome?.message ?? "") },
        surveyResponse: { source: (reply3?.surveyResponse?.source ?? "") },
      }),
      surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }
}
