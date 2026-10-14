/**
 * Builds and schedules reports about conversations. Remote work stays behind typed client ports.
 */

import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as datasetsDatasetQueryServiceApi from "../../../../.cache/proto/acme/datasets/v1/dataset_query_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as experimentsExperimentServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationReportingWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.datasets.v1.DatasetQueryService") private readonly datasetsDatasetQueryClient: datasetsDatasetQueryServiceApi.DatasetQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationService") private readonly messagingConversationClient: messagingConversationServiceApi.ConversationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileLifecycleService") private readonly personalizationProfileLifecycleClient: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts conversations by status.
   */
  async countConversationTotals(req: messagingConversationReportingServiceApi.CountConversationTotalsRequest): Promise<messagingConversationReportingServiceApi.CountConversationTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountConversationTotals", req);
    this.logger.info("count_conversation_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      chatMessage: {
        correlationId: (req?.filter?.ownerId ?? ""),
        occurredAt: req?.filter?.createdAfter,
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> =
      (input, done) => this.messagingChatMessageSyncClient.resolveChatMessageConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationReportingServiceApi.CountConversationTotalsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Deletes a conversation.
   */
  async deleteConversationReport(req: messagingConversationReportingServiceApi.DeleteConversationReportRequest): Promise<messagingConversationReportingServiceApi.DeleteConversationReportResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteConversationReport", req);
    this.logger.info("delete_conversation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { etag: (req?.etag ?? "") },
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const method1 = "scheduleProfileExpiry" as const;
    const invoke1: Unary<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse> =
      (input, done) => this.personalizationProfileLifecycleClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse>(invoke1, request1);
    const request2 = messagingChannelCalculationServiceApi.EstimateChannelRequest.fromPartial({
      channel: {
        owner: {
          displayName: (reply1?.profile?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.messagingChannelCalculationClient);
    const invoke2: Unary<messagingChannelCalculationServiceApi.EstimateChannelRequest, messagingChannelCalculationServiceApi.EstimateChannelResponse> =
      (input, done) => proxy2.estimateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelCalculationServiceApi.EstimateChannelRequest, messagingChannelCalculationServiceApi.EstimateChannelResponse>(invoke2, request2);
    const request3 = messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((reply1?.profile?.attributes ?? {}))),
        correlationId: (reply2?.result?.correlationId ?? ""),
      },
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.profile?.contact?.email ?? ""),
          preferredChannel: (reply1?.profile?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityRequest, messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse> =
      (input, done) => this.messagingChatMessageValidationClient.checkChatMessageEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityRequest, messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse>(invoke3, request3);
    const request4 = notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { etag: (reply1?.profile?.audit?.etag ?? "") } },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.cancelSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse>(invoke4, spread4);
    const request5 = communityForumServiceApi.BatchCreateForumsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply5 = await upload<communityForumServiceApi.BatchCreateForumsRequest, communityForumServiceApi.BatchCreateForumsResponse>(
      (done) => this.communityForumClient.batchCreateForums(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.conversationId ?? "") });
    return mergeResponses(
      messagingConversationReportingServiceApi.DeleteConversationReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationReportingServiceApi.DeleteConversationReportResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingConversationReportingServiceApi.DeleteConversationReportResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      messagingConversationReportingServiceApi.DeleteConversationReportResponse.fromPartial({ result: { status: (reply4?.outcome?.status ?? "") } }),
    );
  }

  /**
   * Returns a conversation.
   */
  async fetchConversationReport(req: messagingConversationReportingServiceApi.FetchConversationReportRequest): Promise<messagingConversationReportingServiceApi.FetchConversationReportResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchConversationReport", req);
    this.logger.info("fetch_conversation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = messagingConversationQueryServiceApi.BrowseConversationsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.context?.deadline,
        labels: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
        ownerId: (input1?.context?.actor?.userId ?? ""),
      },
    });
    const invoke1: Unary<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse> =
      (input, done) => this.messagingConversationQueryClient.browseConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(invoke1, request1);
    return mergeResponses(
      messagingConversationReportingServiceApi.FetchConversationReportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingConversationReportingServiceApi.FetchConversationReportResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } }),
    );
  }

  /**
   * Generates a conversation.
   */
  async generateConversationReport(req: messagingConversationReportingServiceApi.GenerateConversationReportRequest): Promise<messagingConversationReportingServiceApi.GenerateConversationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateConversationReport", req);
    this.logger.info("generate_conversation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
      surveyResponse: { subject: { email: (req?.context?.actor?.email ?? "") } },
    });
    const cloned1: surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.approveSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse>(invoke1, cloned1);
    const request2 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromPartial({
      chatMessage: {
        occurredAt: reply1?.surveyResponse?.occurredAt,
        subject: { displayName: (reply1?.surveyResponse?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (reply1?.surveyResponse?.subject?.email ?? "") } },
    });
    const decoded2 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.toJSON(request2))),
    );
    const invoke2: Unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> =
      (input, done) => this.messagingChatMessageValidationClient.explainChatMessageDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse>(invoke2, decoded2);
    const request3 = documentsDocumentQueryServiceApi.CountDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.surveyResponse?.attributes ?? {}))),
        ownerId: (reply2?.chatMessage?.subject?.channelId ?? ""),
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.documents.v1.CountDocumentsRequest",
      value: Buffer.from(documentsDocumentQueryServiceApi.CountDocumentsRequest.encode(request3).finish()),
    });
    const unpacked3 = documentsDocumentQueryServiceApi.CountDocumentsRequest.decode(envelope3.value);
    const invoke3: Unary<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.countDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse>(invoke3, unpacked3);
    const request4 = messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest.fromPartial({
      chatMessage: { sequence: (reply1?.surveyResponse?.sequence ?? 0) },
      context: req?.context,
    });
    const client4 = this.clients.get<messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient>("acme.messaging.v1.ChatMessageCalculationService");
    const invoke4: Unary<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse> =
      (input, done) => client4.simulateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse>(invoke4, request4);
    const request5 = experimentsExperimentServiceApi.BatchCreateExperimentsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        format: (req?.details?.format ?? ""),
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply5 = await upload<experimentsExperimentServiceApi.BatchCreateExperimentsRequest, experimentsExperimentServiceApi.BatchCreateExperimentsResponse>(
      (done) => this.experimentsExperimentClient.batchCreateExperiments(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      messagingConversationReportingServiceApi.GenerateConversationReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingConversationReportingServiceApi.GenerateConversationReportResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      messagingConversationReportingServiceApi.GenerateConversationReportResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      messagingConversationReportingServiceApi.GenerateConversationReportResponse.fromPartial({
        result: {
          correlationId: (reply4?.chatMessage?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      messagingConversationReportingServiceApi.GenerateConversationReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Schedules a conversation.
   */
  async scheduleConversationReport(req: messagingConversationReportingServiceApi.ScheduleConversationReportRequest): Promise<messagingConversationReportingServiceApi.ScheduleConversationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleConversationReport", req);
    this.logger.info("schedule_conversation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.SimulateChannelRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.SimulateChannelRequest, messagingChannelCalculationServiceApi.SimulateChannelResponse> =
      (input, done) => this.messagingChannelCalculationClient.simulateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<messagingChannelCalculationServiceApi.SimulateChannelRequest, messagingChannelCalculationServiceApi.SimulateChannelResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = datasetsDatasetQueryServiceApi.BrowseDatasetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.channel?.audit?.updatedAt,
        ownerId: (reply1?.channel?.components?.["primary"]?.componentId ?? ""),
        region: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<datasetsDatasetQueryServiceApi.BrowseDatasetsRequest, datasetsDatasetQueryServiceApi.BrowseDatasetsResponse> =
      (input, done) => this.datasetsDatasetQueryClient.browseDatasets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<datasetsDatasetQueryServiceApi.BrowseDatasetsRequest, datasetsDatasetQueryServiceApi.BrowseDatasetsResponse>(invoke2, request2));
    const request3 = surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: { subject: { email: (reply1?.channel?.owner?.email ?? "") } },
    });
    const invoke3: Unary<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.rejectSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("ScheduleConversationReport.RejectSurveyResponse", () => call<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationReportingServiceApi.ScheduleConversationReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingConversationReportingServiceApi.ScheduleConversationReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingConversationReportingServiceApi.ScheduleConversationReportResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      messagingConversationReportingServiceApi.ScheduleConversationReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a conversation.
   */
  async shareConversationReport(req: messagingConversationReportingServiceApi.ShareConversationReportRequest): Promise<messagingConversationReportingServiceApi.ShareConversationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareConversationReport", req);
    this.logger.info("share_conversation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      deliveryAttempt: { correlationId: (req?.details?.templateId ?? "") },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.estimateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.deliveryAttempt?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>(
      "acme.messaging.v1.ConversationReportingService/ShareConversationReport:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      messagingConversationReportingServiceApi.ShareConversationReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingConversationReportingServiceApi.ShareConversationReportResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationReportingServiceApi.ShareConversationReportResponse.fromPartial({
        conversation: {
          assignee: { email: (req?.details?.recipient?.email ?? "") },
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of conversations as they happen.
   */
  async streamConversationMetrics(req: messagingConversationReportingServiceApi.StreamConversationMetricsRequest): Promise<messagingConversationReportingServiceApi.StreamConversationMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamConversationMetrics", req);
    this.logger.info("stream_conversation_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostApprovalServiceApi.EscalatePostRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.subscriber?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      post: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<communityPostApprovalServiceApi.EscalatePostRequest, communityPostApprovalServiceApi.EscalatePostResponse> =
      (input, done) => this.communityPostApprovalClient.escalatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityPostApprovalServiceApi.EscalatePostRequest, communityPostApprovalServiceApi.EscalatePostResponse>(invoke1, request1));
    const request2 = messagingConversationServiceApi.ListConversationsRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
        statuses: (req?.filter?.statuses ?? []).map((value) => value),
      },
    });
    const invoke2: Unary<messagingConversationServiceApi.ListConversationsRequest, messagingConversationServiceApi.ListConversationsResponse> =
      (input, done) => this.messagingConversationClient.listConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingConversationServiceApi.ListConversationsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      messagingConversationReportingServiceApi.StreamConversationMetricsResponse.fromPartial({
        conversation: { audit: { updatedBy: (reply1?.post?.audit?.updatedBy ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingConversationReportingServiceApi.StreamConversationMetricsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingConversationReportingServiceApi.StreamConversationMetricsResponse.fromPartial({
        conversation: {
          assignee: { email: (req?.subscriber?.email ?? "") },
          requester: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}
