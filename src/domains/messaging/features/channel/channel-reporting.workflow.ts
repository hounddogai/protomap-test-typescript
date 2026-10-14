/**
 * Builds and schedules reports about channels. Remote work stays behind typed client ports.
 */

import * as localizationTranslationJobReportingServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChannelReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChannelValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import * as messagingConversationQueryServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelReportingWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationLifecycleService") private readonly messagingConversationLifecycleClient: messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantSyncService") private readonly messagingParticipantSyncClient: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionApprovalService") private readonly surveysQuestionApprovalClient: surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryWorkflowService") private readonly webhooksWebhookDeliveryWorkflowClient: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts channels by status.
   */
  async countChannelTotals(req: messagingChannelReportingServiceApi.CountChannelTotalsRequest): Promise<messagingChannelReportingServiceApi.CountChannelTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountChannelTotals", req);
    this.logger.info("count_channel_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.RecalculateChannelsRequest.fromPartial({
      channel: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse> =
      (input, done) => this.messagingChannelCalculationClient.recalculateChannels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChannelReportingServiceApi.CountChannelTotalsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Deletes a channel.
   */
  async deleteChannelReport(req: messagingChannelReportingServiceApi.DeleteChannelReportRequest): Promise<messagingChannelReportingServiceApi.DeleteChannelReportResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteChannelReport", req);
    this.logger.info("delete_channel_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.generateTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("DeleteChannelReport.GenerateTranslationJobReport", () => call<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse>(invoke1, request1));
    const request2 = messagingParticipantSyncServiceApi.PullParticipantsRequest.fromPartial({
      context: req?.context,
      participant: { audit: { etag: (req?.etag ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<messagingParticipantSyncServiceApi.PullParticipantsRequest, messagingParticipantSyncServiceApi.PullParticipantsResponse> =
      (input, done) => this.messagingParticipantSyncClient.pullParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.channelId ?? "") });
    return mergeResponses(
      messagingChannelReportingServiceApi.DeleteChannelReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingChannelReportingServiceApi.DeleteChannelReportResponse.fromPartial({
        effectiveAt: reply2?.outcome?.effectiveAt,
        result: { status: (reply2?.result?.status ?? "") },
      }),
    );
  }

  /**
   * Returns a channel.
   */
  async fetchChannelReport(req: messagingChannelReportingServiceApi.FetchChannelReportRequest): Promise<messagingChannelReportingServiceApi.FetchChannelReportResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchChannelReport", req);
    this.logger.info("fetch_channel_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>(
      "acme.messaging.v1.ChannelReportingService/FetchChannelReport:0", request1,
    );
    const request2 = surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.webhookDelivery?.subject?.displayName ?? "") },
        effectiveAt: reply1?.outcome?.effectiveAt,
      },
    });
    const invoke2: Unary<surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest, surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse> =
      (input, done) => this.surveysQuestionApprovalClient.commentQuestionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest, surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse>(invoke2, request2));
    return mergeResponses(
      messagingChannelReportingServiceApi.FetchChannelReportResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChannelReportingServiceApi.FetchChannelReportResponse.fromPartial({
        channel: { audit: { etag: (reply2?.question?.audit?.etag ?? "") } },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      messagingChannelReportingServiceApi.FetchChannelReportResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }

  /**
   * Generates a channel.
   */
  async generateChannelReport(req: messagingChannelReportingServiceApi.GenerateChannelReportRequest): Promise<messagingChannelReportingServiceApi.GenerateChannelReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateChannelReport", req);
    this.logger.info("generate_channel_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      chatMessage: { subject: { channelId: (req?.channelId ?? "") } },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.reconcileChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.annotateDeliveryAttemptVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest.fromPartial({
      context: req?.context,
      participant: {
        attributes: Object.fromEntries(Object.entries((reply1?.chatMessage?.attributes ?? {}))),
        identityDocument: { $case: "passport", passport: { number: (reply2?.deliveryAttempt?.subject?.number ?? "") } },
        relationshipManager: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest, messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse> =
      (input, done) => this.messagingParticipantCalculationClient.explainParticipantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      messagingChannelReportingServiceApi.GenerateChannelReportResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      messagingChannelReportingServiceApi.GenerateChannelReportResponse.fromPartial({
        result: { correlationId: (reply2?.deliveryAttempt?.correlationId ?? "") },
      }),
      messagingChannelReportingServiceApi.GenerateChannelReportResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      messagingChannelReportingServiceApi.GenerateChannelReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists channels a page at a time.
   */
  async listChannelReports(req: messagingChannelReportingServiceApi.ListChannelReportsRequest): Promise<messagingChannelReportingServiceApi.ListChannelReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChannelReports", req);
    this.logger.info("list_channel_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelValidationServiceApi.NormalizeChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const method1 = "normalizeChannel" as const;
    const invoke1: Unary<messagingChannelValidationServiceApi.NormalizeChannelRequest, messagingChannelValidationServiceApi.NormalizeChannelResponse> =
      (input, done) => this.messagingChannelValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChannelValidationServiceApi.NormalizeChannelRequest, messagingChannelValidationServiceApi.NormalizeChannelResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChannelReportingServiceApi.ListChannelReportsResponse.fromPartial({
      channels: [{ dimensions: { unit: (reply1?.channel?.dimensions?.unit ?? "") } }],
      result: { message: (reply1?.outcome?.message ?? "") },
    });
  }

  /**
   * Schedules a channel.
   */
  async scheduleChannelReport(req: messagingChannelReportingServiceApi.ScheduleChannelReportRequest): Promise<messagingChannelReportingServiceApi.ScheduleChannelReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleChannelReport", req);
    this.logger.info("schedule_channel_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      deliveryAttempt: { source: (req?.channelId ?? "") },
      details: { authorEmail: (req?.context?.actor?.email ?? "") },
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.notificationsDeliveryAttemptHistoryClient);
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse> =
      (input, done) => proxy1.revertDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? ""),
          notificationTemplateId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.checkDeliveryAttemptEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse>(invoke2, request2);
    const request3 = messagingConversationQueryServiceApi.BrowseConversationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.deliveryAttempt?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply2?.deliveryAttempt?.correlationId ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse> =
      (input, done) => this.messagingConversationQueryClient.browseConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.fromPartial({
      context: input4?.context,
      webhookDelivery: {
        correlationId: (reply2?.deliveryAttempt?.correlationId ?? ""),
        subject: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const invoke4: Unary<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient.signalWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      messagingChannelReportingServiceApi.ScheduleChannelReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingChannelReportingServiceApi.ScheduleChannelReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingChannelReportingServiceApi.ScheduleChannelReportResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      messagingChannelReportingServiceApi.ScheduleChannelReportResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      messagingChannelReportingServiceApi.ScheduleChannelReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a channel.
   */
  async shareChannelReport(req: messagingChannelReportingServiceApi.ShareChannelReportRequest): Promise<messagingChannelReportingServiceApi.ShareChannelReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareChannelReport", req);
    this.logger.info("share_channel_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
      question: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { email: (req?.details?.recipient?.email ?? "") },
      },
    });
    const cloned1: surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest, surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse> =
      (input, done) => this.surveysQuestionApprovalClient.delegateQuestionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest, surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse>(invoke1, cloned1);
    const request2 = messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest.fromPartial({
      context: req?.context,
      conversation: { audit: { updatedAt: reply1?.question?.audit?.updatedAt } },
      details: { notify: { name: req?.details?.recipient?.name } },
    });
    const decoded2 = messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest.toJSON(request2))),
    );
    const invoke2: Unary<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse> =
      (input, done) => this.messagingConversationLifecycleClient.scheduleConversationExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      messagingChannelReportingServiceApi.ShareChannelReportResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      messagingChannelReportingServiceApi.ShareChannelReportResponse.fromPartial({
        channel: {
          audit: { createdBy: (reply2?.conversation?.audit?.createdBy ?? "") },
          owner: { email: (reply2?.conversation?.assignee?.email ?? "") },
        },
      }),
      messagingChannelReportingServiceApi.ShareChannelReportResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }
}
