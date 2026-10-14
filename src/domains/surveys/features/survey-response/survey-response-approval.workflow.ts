/**
 * Routes survey responses through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as analyticsAnalyticsEventQueryServiceApi from "../../../../../.cache/proto/acme/analytics/v1/analytics_event_query_service.js";
import * as billingBillingAccountQueryServiceApi from "../../../../../.cache/proto/acme/billing/v1/billing_account_query_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as chatHandoffReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as communityForumWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as surveysSurveyQueryServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toSurveyResponseRecord } from "../../data/records.js";
import { SurveysRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey response operations and persist audit data.
 */
@injectable()
export class SurveyResponseApprovalWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.analytics.v1.AnalyticsEventQueryService") private readonly analyticsAnalyticsEventQueryClient: analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient,
    @inject("grpc:acme.billing.v1.BillingAccountQueryService") private readonly billingBillingAccountQueryClient: billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomWorkflowService") private readonly chatChatRoomWorkflowClient: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.chat.v1.HandoffWorkflowService") private readonly chatHandoffWorkflowClient: chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyQueryService") private readonly surveysSurveyQueryClient: surveysSurveyQueryServiceApi.SurveyQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyService") private readonly surveysSurveyClient: surveysSurveyServiceApi.SurveyServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a survey response.
   */
  async approveSurveyResponse(req: surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest): Promise<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "ApproveSurveyResponse", req);
    this.logger.info("approve_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyQueryServiceApi.ResolveSurveysRequest.fromPartial({ context: req?.context });
    const proxy1 = forwarding(this.surveysSurveyQueryClient);
    const invoke1: Unary<surveysSurveyQueryServiceApi.ResolveSurveysRequest, surveysSurveyQueryServiceApi.ResolveSurveysResponse> =
      (input, done) => proxy1.resolveSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyQueryServiceApi.ResolveSurveysRequest, surveysSurveyQueryServiceApi.ResolveSurveysResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke2: Unary<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.explainDeliveryAttemptCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse.fromPartial({
        result: { correlationId: (reply2?.deliveryAttempt?.correlationId ?? "") },
      }),
      surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a survey response.
   */
  async commentSurveyResponseApproval(req: surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest): Promise<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "CommentSurveyResponseApproval", req);
    this.logger.info("comment_survey_response_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = billingBillingAccountQueryServiceApi.CountBillingAccountsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<billingBillingAccountQueryServiceApi.CountBillingAccountsRequest, billingBillingAccountQueryServiceApi.CountBillingAccountsResponse> =
      (input, done) => this.billingBillingAccountQueryClient.countBillingAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<billingBillingAccountQueryServiceApi.CountBillingAccountsRequest, billingBillingAccountQueryServiceApi.CountBillingAccountsResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") },
      }),
    );
  }

  /**
   * Delegates a survey response.
   */
  async delegateSurveyResponseApproval(req: surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalRequest): Promise<surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "DelegateSurveyResponseApproval", req);
    this.logger.info("delegate_survey_response_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsExposureReportingServiceApi.ListExposureReportsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((input1?.surveyResponse?.attributes ?? {}))),
        ownerId: (input1?.details?.approver?.userId ?? ""),
      },
    });
    const invoke1: Unary<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse> =
      (input, done) => this.experimentsExposureReportingClient.listExposureReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.surveyResponse?.measurements ?? []).map(async (item) => {
      const request2 = customersHouseholdCalculationServiceApi.SimulateHouseholdRequest.fromPartial({
        context: req?.context,
        household: {
          children: [{
            audit: { createdAt: item?.observedAt },
            manager: {
              displayName: (req?.surveyResponse?.subject?.displayName ?? ""),
              email: (req?.details?.approver?.email ?? ""),
            },
          }],
        },
      });
      const invoke2: Unary<customersHouseholdCalculationServiceApi.SimulateHouseholdRequest, customersHouseholdCalculationServiceApi.SimulateHouseholdResponse> =
        (input, done) => this.customersHouseholdCalculationClient.simulateHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<customersHouseholdCalculationServiceApi.SimulateHouseholdRequest, customersHouseholdCalculationServiceApi.SimulateHouseholdResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? customersHouseholdCalculationServiceApi.SimulateHouseholdResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalResponse.fromPartial({
        surveyResponse: {
          subject: req?.surveyResponse?.subject,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a survey response.
   */
  async getSurveyResponseApprovalStatus(req: surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusRequest): Promise<surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.surveyResponseId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_response_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSurveyResponseApprovalStatus", req);
    this.logger.info("get_survey_response_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.context?.deadline },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const cloned1: chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse> =
      (input, done) => this.chatChatRoomWorkflowClient.retryChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse>(invoke1, cloned1);
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusResponse.fromPartial({ surveyResponse: { surveyResponseId: (req?.surveyResponseId ?? "") } }),
    );
  }

  /**
   * Lists survey responses a page at a time.
   */
  async listPendingSurveyResponses(req: surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesRequest): Promise<surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingSurveyResponses", req);
    this.logger.info("list_pending_survey_responses", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest.fromPartial({
      context: req?.context,
      handoff: { assignee: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const decoded1 = chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse> =
      (input, done) => this.chatHandoffWorkflowClient.cancelHandoffWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse.fromPartial({
      result: { status: (reply1?.result?.status ?? "") },
      surveyResponses: [{
        subject: {
          displayName: ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
      }],
    });
  }

  /**
   * Recalls a survey response.
   */
  async recallSurveyResponse(req: surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest): Promise<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "RecallSurveyResponse", req);
    this.logger.info("recall_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.surveyResponse?.subject?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.SubscribeNotificationTemplateUpdatesRequest",
      value: Buffer.from(notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.subscribeNotificationTemplateUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse>(invoke1, unpacked1);
    const request2 = analyticsAnalyticsEventQueryServiceApi.CountAnalyticsEventsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.notificationTemplate?.billingAddress?.region ?? "") },
    });
    const client2 = this.clients.get<analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient>("acme.analytics.v1.AnalyticsEventQueryService");
    const invoke2: Unary<analyticsAnalyticsEventQueryServiceApi.CountAnalyticsEventsRequest, analyticsAnalyticsEventQueryServiceApi.CountAnalyticsEventsResponse> =
      (input, done) => client2.countAnalyticsEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<analyticsAnalyticsEventQueryServiceApi.CountAnalyticsEventsRequest, analyticsAnalyticsEventQueryServiceApi.CountAnalyticsEventsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse.fromPartial({
        surveyResponse: {
          source: (req?.surveyResponse?.source ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a survey response.
   */
  async rejectSurveyResponse(req: surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest): Promise<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "RejectSurveyResponse", req);
    this.logger.info("reject_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.CancelForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              email: (req?.surveyResponse?.subject?.email ?? ""),
              userId: (req?.details?.approver?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.cancelForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.surveyResponse?.subject?.email ?? "") } },
      notification: {
        assignee: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
        audit: { updatedAt: reply1?.forum?.audit?.updatedAt },
        origin: { $case: "customer", customer: { displayName: (reply1?.forum?.manager?.displayName ?? "") } },
      },
    });
    const invoke2: Unary<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse> =
      (input, done) => this.notificationsNotificationValidationClient.checkNotificationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>(invoke2, request2));
    const request3 = surveysSurveyServiceApi.UpdateSurveyRequest.fromPartial({
      context: req?.context,
      survey: {
        audit: {
          createdBy: (reply1?.forum?.audit?.createdBy ?? ""),
          updatedBy: (reply2?.notification?.audit?.updatedBy ?? ""),
        },
        billingAddress: { region: (reply1?.forum?.location?.region ?? "") },
      },
    });
    const invoke3: Unary<surveysSurveyServiceApi.UpdateSurveyRequest, surveysSurveyServiceApi.UpdateSurveyResponse> =
      (input, done) => this.surveysSurveyClient.updateSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("RejectSurveyResponse.UpdateSurvey", () => call<surveysSurveyServiceApi.UpdateSurveyRequest, surveysSurveyServiceApi.UpdateSurveyResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        surveyResponse: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse.fromPartial({
        surveyResponse: {
          occurredAt: req?.surveyResponse?.occurredAt,
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a survey response.
   */
  async submitSurveyResponse(req: surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseRequest): Promise<surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse> {
    validateContext(req.context);
    if (req.surveyResponse) {
      await this.repository.save(toSurveyResponseRecord(req.context.tenantId, req.surveyResponse));
    }
    await this.repository.record(req.context.tenantId, "SubmitSurveyResponse", req);
    this.logger.info("submit_survey_response", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyServiceApi.UpdateSurveyRequest.fromPartial({
      context: req?.context,
      survey: {
        counterparty: { displayName: (req?.surveyResponse?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<surveysSurveyServiceApi.UpdateSurveyRequest, surveysSurveyServiceApi.UpdateSurveyResponse> =
      (input, done) => this.surveysSurveyClient.updateSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (reply1?.survey?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.survey?.billingAddress?.lines ?? []).map((value) => value),
          locality: (reply1?.survey?.billingAddress?.locality ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(
      "acme.surveys.v1.SurveyResponseApprovalService/SubmitSurveyResponse:1", request2,
    );
    const request3 = chatHandoffReportingServiceApi.ScheduleHandoffReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse> =
      (input, done) => this.chatHandoffReportingClient.scheduleHandoffReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse.fromPartial({
        surveyResponse: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          subject: { displayName: (reply1?.survey?.counterparty?.displayName ?? "") },
        },
      }),
      surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse.fromPartial({
        surveyResponse: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse.fromPartial({
        surveyResponse: {
          source: (req?.surveyResponse?.source ?? ""),
          surveyResponseId: (req?.surveyResponseId ?? ""),
        },
      }),
    );
  }
}
