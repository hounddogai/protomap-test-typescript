/**
 * Routes channels through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as chatChatBotApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as chatChatBotWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_workflow_service.js";
import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as invoicingInvoiceBatchCalculationServiceApi from "../../../../../.cache/proto/acme/invoicing/v1/invoice_batch_calculation_service.js";
import * as messagingChannelApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as messagingParticipantValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChannelRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelApprovalWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberApprovalService") private readonly audiencesAudienceMemberApprovalClient: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotApprovalService") private readonly chatChatBotApprovalClient: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotWorkflowService") private readonly chatChatBotWorkflowClient: chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.invoicing.v1.InvoiceBatchCalculationService") private readonly invoicingInvoiceBatchCalculationClient: invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageQueryService") private readonly messagingChatMessageQueryClient: messagingChatMessageQueryServiceApi.ChatMessageQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationApprovalService") private readonly messagingConversationApprovalClient: messagingConversationApprovalServiceApi.ConversationApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationLifecycleService") private readonly messagingConversationLifecycleClient: messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantValidationService") private readonly messagingParticipantValidationClient: messagingParticipantValidationServiceApi.ParticipantValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a channel.
   */
  async approveChannel(req: messagingChannelApprovalServiceApi.ApproveChannelRequest): Promise<messagingChannelApprovalServiceApi.ApproveChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ApproveChannel", req);
    this.logger.info("approve_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationRequest.fromPartial({
      context: req?.context,
      invoiceBatch: {
        audit: {
          createdAt: req?.channel?.audit?.createdAt,
          etag: (req?.channel?.audit?.etag ?? ""),
        },
        counterparty: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationRequest, invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationResponse>(
      "acme.messaging.v1.ChannelApprovalService/ApproveChannel:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.ApproveChannelResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      messagingChannelApprovalServiceApi.ApproveChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          name: (req?.channel?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a channel.
   */
  async delegateChannelApproval(req: messagingChannelApprovalServiceApi.DelegateChannelApprovalRequest): Promise<messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "DelegateChannelApproval", req);
    this.logger.info("delegate_channel_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: req?.channel?.audit?.createdAt,
          updatedAt: req?.channel?.audit?.updatedAt,
        },
      },
      context: req?.context,
      details: { approver: { displayName: (req?.channel?.owner?.displayName ?? "") } },
    });
    const invoke1: Unary<chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest, chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse> =
      (input, done) => this.chatChatBotApprovalClient.commentChatBotApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest, chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse>(invoke1, request1));
    const request2 = messagingConversationApprovalServiceApi.SubmitConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          email: (req?.details?.approver?.email ?? ""),
          userId: (req?.channel?.owner?.userId ?? ""),
        },
        audit: { etag: (req?.channel?.audit?.etag ?? "") },
      },
      details: {
        approver: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<messagingConversationApprovalServiceApi.SubmitConversationRequest, messagingConversationApprovalServiceApi.SubmitConversationResponse> =
      (input, done) => this.messagingConversationApprovalClient.submitConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingConversationApprovalServiceApi.SubmitConversationResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest.fromPartial({
      context: req?.context,
      participant: {
        relationshipManager: {
          displayName: ((reply2?.conversation?.origin?.$case === "customer" ? reply2?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse> =
      (input, done) => this.messagingParticipantValidationClient.checkParticipantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    let selected4_2: Array<string> | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected4_2 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected4_2 = [];
    }
    const request4 = audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberRequest.fromPartial({
      audienceMember: {
        primaryAddress: { lines: (selected4_2 ?? []) },
        relationshipManager: { userId: (req?.details?.approver?.userId ?? "") },
      },
      context: req?.context,
      details: { approver: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke4: Unary<audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberApprovalClient.approveAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse.fromPartial({
        channel: { audit: { createdBy: (reply2?.conversation?.audit?.createdBy ?? "") } },
      }),
      messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse.fromPartial({
        channel: {
          owner: { userId: (reply4?.audienceMember?.relationshipManager?.userId ?? "") },
        },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          status: req?.channel?.status,
        },
      }),
    );
  }

  /**
   * Escalates a channel.
   */
  async escalateChannel(req: messagingChannelApprovalServiceApi.EscalateChannelRequest): Promise<messagingChannelApprovalServiceApi.EscalateChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "EscalateChannel", req);
    this.logger.info("escalate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        audit: { updatedAt: req?.channel?.audit?.updatedAt },
        comments: [{ createdAt: req?.channel?.audit?.createdAt }],
      },
    });
    const method1 = "scheduleConversationExpiry" as const;
    const invoke1: Unary<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse> =
      (input, done) => this.messagingConversationLifecycleClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse>(invoke1, request1);
    const request2 = messagingParticipantValidationServiceApi.LintParticipantsRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply1?.conversation?.requester?.phone ?? "") } },
    });
    const proxy2 = forwarding(this.messagingParticipantValidationClient);
    const invoke2: Unary<messagingParticipantValidationServiceApi.LintParticipantsRequest, messagingParticipantValidationServiceApi.LintParticipantsResponse> =
      (input, done) => proxy2.lintParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantValidationServiceApi.LintParticipantsRequest, messagingParticipantValidationServiceApi.LintParticipantsResponse>(invoke2, request2);
    const request3 = messagingConversationApprovalServiceApi.CommentConversationApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { userId: (reply2?.participant?.relationshipManager?.userId ?? "") },
      },
    });
    const invoke3: Unary<messagingConversationApprovalServiceApi.CommentConversationApprovalRequest, messagingConversationApprovalServiceApi.CommentConversationApprovalResponse> =
      (input, done) => this.messagingConversationApprovalClient.commentConversationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationApprovalServiceApi.CommentConversationApprovalRequest, messagingConversationApprovalServiceApi.CommentConversationApprovalResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.EscalateChannelResponse.fromPartial({
        channel: { owner: { userId: (reply1?.conversation?.assignee?.userId ?? "") } },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      messagingChannelApprovalServiceApi.EscalateChannelResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      messagingChannelApprovalServiceApi.EscalateChannelResponse.fromPartial({
        channel: {
          owner: { displayName: (reply3?.conversation?.assignee?.displayName ?? "") },
        },
      }),
      messagingChannelApprovalServiceApi.EscalateChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          specs: (req?.channel?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a channel.
   */
  async getChannelApprovalStatus(req: messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest): Promise<messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChannelApprovalStatus", req);
    this.logger.info("get_channel_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } });
  }

  /**
   * Recalls a channel.
   */
  async recallChannel(req: messagingChannelApprovalServiceApi.RecallChannelRequest): Promise<messagingChannelApprovalServiceApi.RecallChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "RecallChannel", req);
    this.logger.info("recall_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: req?.channel?.audit?.createdAt,
          etag: (req?.channel?.audit?.etag ?? ""),
          updatedAt: req?.channel?.audit?.updatedAt,
        },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.recallSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = chatChatBotWorkflowServiceApi.SignalChatBotWorkflowRequest.fromPartial({
      chatBot: {
        audit: {
          createdBy: (input2?.channel?.audit?.createdBy ?? ""),
          updatedBy: (input2?.channel?.audit?.updatedBy ?? ""),
        },
        owner: { email: (reply1?.subscription?.owner?.email ?? "") },
        action: { $case: "route", route: {
          weight: ((reply1?.subscription?.action?.$case === "route" ? reply1?.subscription?.action.route : undefined)?.weight ?? 0),
        } },
      },
      context: input2?.context,
    });
    const invoke2: Unary<chatChatBotWorkflowServiceApi.SignalChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse> =
      (input, done) => this.chatChatBotWorkflowClient.signalChatBotWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotWorkflowServiceApi.SignalChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = messagingParticipantReportingServiceApi.CountParticipantTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.chatBot?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply2?.chatBot?.chatBotId ?? ""),
        region: (selected3_1 ?? ""),
      },
    });
    const invoke3: Unary<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse> =
      (input, done) => this.messagingParticipantReportingClient.countParticipantTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse>(invoke3, request3);
    const request4 = messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest.fromPartial({ context: req?.context });
    const decoded4 = messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest.toJSON(request4))),
    );
    const invoke4: Unary<messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest, messagingChatMessageQueryServiceApi.ResolveChatMessagesResponse> =
      (input, done) => this.messagingChatMessageQueryClient.resolveChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest, messagingChatMessageQueryServiceApi.ResolveChatMessagesResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.RecallChannelResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      messagingChannelApprovalServiceApi.RecallChannelResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      messagingChannelApprovalServiceApi.RecallChannelResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      messagingChannelApprovalServiceApi.RecallChannelResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      messagingChannelApprovalServiceApi.RecallChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          owner: req?.channel?.owner,
        },
      }),
    );
  }

  /**
   * Rejects a channel.
   */
  async rejectChannel(req: messagingChannelApprovalServiceApi.RejectChannelRequest): Promise<messagingChannelApprovalServiceApi.RejectChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "RejectChannel", req);
    this.logger.info("reject_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationApprovalServiceApi.ApproveModerationRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.approver?.email ?? "") } },
      moderation: {
        assignee: { userId: (req?.channel?.owner?.userId ?? "") },
        audit: { createdAt: req?.channel?.audit?.createdAt },
        requester: { email: (req?.channel?.owner?.email ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ApproveModerationRequest",
      value: Buffer.from(communityModerationApprovalServiceApi.ApproveModerationRequest.encode(request1).finish()),
    });
    const unpacked1 = communityModerationApprovalServiceApi.ApproveModerationRequest.decode(envelope1.value);
    const invoke1: Unary<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.approveModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse>(invoke1, unpacked1);
    const request2 = messagingParticipantReportingServiceApi.ScheduleParticipantReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      participantId: (reply1?.moderation?.assignee?.userId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const client2 = this.clients.get<messagingParticipantReportingServiceApi.ParticipantReportingServiceClient>("acme.messaging.v1.ParticipantReportingService");
    const invoke2: Unary<messagingParticipantReportingServiceApi.ScheduleParticipantReportRequest, messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse> =
      (input, done) => client2.scheduleParticipantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantReportingServiceApi.ScheduleParticipantReportRequest, messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse>(invoke2, request2);
    const request3 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
      context: req?.context,
      conversation: { assignee: { displayName: (req?.channel?.owner?.displayName ?? "") } },
    });
    const invoke3: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
      (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        measurements: [{ unit: (req?.channel?.dimensions?.unit ?? "") }],
        subject: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
          displayName: (req?.channel?.owner?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke4: Unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pushChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.RejectChannelResponse.fromPartial({
        channel: { owner: { email: (reply1?.moderation?.assignee?.email ?? "") } },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      messagingChannelApprovalServiceApi.RejectChannelResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingChannelApprovalServiceApi.RejectChannelResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      messagingChannelApprovalServiceApi.RejectChannelResponse.fromPartial({
        channel: { code: (reply4?.chatMessage?.subject?.code ?? "") },
        outcome: { message: (reply4?.result?.message ?? "") },
      }),
      messagingChannelApprovalServiceApi.RejectChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          status: req?.channel?.status,
        },
      }),
    );
  }

  /**
   * Submits a channel.
   */
  async submitChannel(req: messagingChannelApprovalServiceApi.SubmitChannelRequest): Promise<messagingChannelApprovalServiceApi.SubmitChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "SubmitChannel", req);
    this.logger.info("submit_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        audit: {
          createdAt: req?.channel?.audit?.createdAt,
          updatedBy: (req?.channel?.audit?.updatedBy ?? ""),
        },
        dimensions: { length: (req?.channel?.dimensions?.length ?? 0) },
        owner: { displayName: (req?.channel?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesClient.cloneMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("SubmitChannel.CloneMetricSeries", () => call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelApprovalServiceApi.SubmitChannelResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      messagingChannelApprovalServiceApi.SubmitChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
