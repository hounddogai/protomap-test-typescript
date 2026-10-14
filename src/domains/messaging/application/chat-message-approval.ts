/**
 * Routes chat messages through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatMessageRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageApprovalWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignWorkflowService") private readonly campaignsMarketingCampaignWorkflowClient: campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionApprovalService") private readonly mediaRenditionApprovalClient: mediaRenditionApprovalServiceApi.RenditionApprovalServiceClient,
    @inject("grpc:acme.media.v1.RenditionReportingService") private readonly mediaRenditionReportingClient: mediaRenditionReportingServiceApi.RenditionReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelLifecycleService") private readonly messagingChannelLifecycleClient: messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageLifecycleService") private readonly messagingChatMessageLifecycleClient: messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a chat message.
   */
  async approveChatMessage(req: messagingChatMessageApprovalServiceApi.ApproveChatMessageRequest): Promise<messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ApproveChatMessage", req);
    this.logger.info("approve_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request1 = campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowRequest.fromPartial({
        context: req?.context,
        marketingCampaign: {
          audit: { createdAt: item?.observedAt },
          participants: [{ contact: { email: (req?.details?.approver?.email ?? "") } }],
        },
      });
      const invoke1: Unary<campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse> =
        (input, done) => this.campaignsMarketingCampaignWorkflowClient.resumeMarketingCampaignWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse.fromPartial({});
    const request2 = messagingChatMessageLifecycleServiceApi.ActivateChatMessageRequest.fromPartial({
      chatMessageId: (req?.chatMessageId ?? ""),
      context: req?.context,
      details: {
        newOwner: {
          displayName: (reply1?.marketingCampaign?.organizer?.displayName ?? ""),
          email: (reply1?.marketingCampaign?.organizer?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke2: Unary<messagingChatMessageLifecycleServiceApi.ActivateChatMessageRequest, messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse> =
      (input, done) => this.messagingChatMessageLifecycleClient.activateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingChatMessageLifecycleServiceApi.ActivateChatMessageRequest, messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { displayName: (reply2?.chatMessage?.subject?.displayName ?? "") },
        audit: { updatedAt: reply1?.marketingCampaign?.audit?.updatedAt },
        origin: { $case: "customer", customer: { code: (req?.chatMessage?.subject?.code ?? "") } },
      },
    });
    const invoke3: Unary<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.reconcileHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(invoke3, request3));
    const request4 = messagingChannelLifecycleServiceApi.ActivateChannelRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
      details: {
        newOwner: { email: (reply3?.handoff?.requester?.email ?? "") },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke4: Unary<messagingChannelLifecycleServiceApi.ActivateChannelRequest, messagingChannelLifecycleServiceApi.ActivateChannelResponse> =
      (input, done) => this.messagingChannelLifecycleClient.activateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("ApproveChatMessage.ActivateChannel", () => call<messagingChannelLifecycleServiceApi.ActivateChannelRequest, messagingChannelLifecycleServiceApi.ActivateChannelResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { correlationId: (reply2?.chatMessage?.correlationId ?? "") },
      }),
      messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      messagingChatMessageApprovalServiceApi.ApproveChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a chat message.
   */
  async commentChatMessageApproval(req: messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalRequest): Promise<messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "CommentChatMessageApproval", req);
    this.logger.info("comment_chat_message_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelLifecycleServiceApi.SuspendChannelRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
      details: {
        effectiveAt: req?.details?.effectiveAt,
        newOwner: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const invoke1: Unary<messagingChannelLifecycleServiceApi.SuspendChannelRequest, messagingChannelLifecycleServiceApi.SuspendChannelResponse> =
      (input, done) => this.messagingChannelLifecycleClient.suspendChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingChannelSyncServiceApi.GetChannelSyncStateRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
    });
    const reply2 = await this.workQueue.enqueue<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>(
      "acme.messaging.v1.ChatMessageApprovalService/CommentChatMessageApproval:1", request2,
    );
    const request3 = messagingConversationValidationServiceApi.NormalizeConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: { createdBy: (reply2?.channel?.audit?.createdBy ?? "") },
        requester: { email: (reply2?.channel?.owner?.email ?? "") },
      },
    });
    const invoke3: Unary<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.normalizeConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse.fromPartial({
        chatMessage: { measurements: [{ unit: (reply1?.channel?.dimensions?.unit ?? "") }] },
      }),
      messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse.fromPartial({
        chatMessage: {
          subject: {
            code: ((reply3?.conversation?.origin?.$case === "customer" ? reply3?.conversation?.origin.customer : undefined)?.code ?? ""),
          },
        },
      }),
      messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a chat message.
   */
  async delegateChatMessageApproval(req: messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest): Promise<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "DelegateChatMessageApproval", req);
    this.logger.info("delegate_chat_message_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.details?.approver?.userId ?? "") },
    });
    const stream1 = this.featureflagsFeatureFlagQueryClient.exportFeatureFlags(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsResponse.fromPartial({});
    const request2 = searchSearchIndexValidationServiceApi.LintSearchIndexesRequest.fromPartial({
      context: req?.context,
      searchIndex: { owner: { userId: (req?.details?.approver?.userId ?? "") } },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexValidationClient.lintSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<searchSearchIndexValidationServiceApi.LintSearchIndexesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          correlationId: (req?.chatMessage?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists chat messages a page at a time.
   */
  async listPendingChatMessages(req: messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest): Promise<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingChatMessages", req);
    this.logger.info("list_pending_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest, mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse> =
      (input, done) => this.mediaRenditionReportingClient.scheduleRenditionReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Rejects a chat message.
   */
  async rejectChatMessage(req: messagingChatMessageApprovalServiceApi.RejectChatMessageRequest): Promise<messagingChatMessageApprovalServiceApi.RejectChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "RejectChatMessage", req);
    this.logger.info("reject_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>> = [];
    for (const item of (req?.chatMessage?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest.fromPartial({
          affinity: {
            measurements: [{
              metric: (item?.metric ?? ""),
              observedAt: item?.observedAt,
              value: (item?.value ?? 0),
            }],
          },
          context: req?.context,
        });
        const invoke1: Unary<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse> =
          (input, done) => this.personalizationAffinitySyncClient.reconcileAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse.fromPartial({});
    const request2 = notificationsNotificationSyncServiceApi.SyncNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.details?.approver?.displayName ?? "") } },
        requester: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.syncNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageApprovalServiceApi.RejectChatMessageResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      messagingChatMessageApprovalServiceApi.RejectChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          sequence: (req?.chatMessage?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a chat message.
   */
  async submitChatMessage(req: messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest): Promise<messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "SubmitChatMessage", req);
    this.logger.info("submit_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionApprovalServiceApi.ApproveRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        code: (req?.chatMessage?.subject?.code ?? ""),
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
    });
    const method1 = "approveRendition" as const;
    const invoke1: Unary<mediaRenditionApprovalServiceApi.ApproveRenditionRequest, mediaRenditionApprovalServiceApi.ApproveRenditionResponse> =
      (input, done) => this.mediaRenditionApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionApprovalServiceApi.ApproveRenditionRequest, mediaRenditionApprovalServiceApi.ApproveRenditionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          correlationId: (req?.chatMessage?.correlationId ?? ""),
        },
      }),
    );
  }
}
