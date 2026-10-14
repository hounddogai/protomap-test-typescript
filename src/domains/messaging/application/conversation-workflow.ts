/**
 * Runs the long-lived workflow that takes a conversation from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationWorkflowServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, retry, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toConversationRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationWorkflowWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobApprovalService") private readonly localizationTranslationJobApprovalClient: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageApprovalService") private readonly messagingChatMessageApprovalClient: messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageReportingService") private readonly messagingChatMessageReportingClient: messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a conversation.
   */
  async advanceConversationWorkflow(req: messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "AdvanceConversationWorkflow", req);
    this.logger.info("advance_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffApprovalServiceApi.RecallHandoffRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.conversation?.assignee?.userId ?? "") } },
    });
    const invoke1: Unary<chatHandoffApprovalServiceApi.RecallHandoffRequest, chatHandoffApprovalServiceApi.RecallHandoffResponse> =
      (input, done) => this.chatHandoffApprovalClient.recallHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatHandoffApprovalServiceApi.RecallHandoffRequest, chatHandoffApprovalServiceApi.RecallHandoffResponse>(invoke1, request1));
    let selected2_3: string | undefined;
    switch (reply1?.handoff?.origin?.$case) {
      case "customer":
        selected2_3 = ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.conversation?.requester?.preferredChannel ?? ""),
        },
      },
      searchIndex: {
        audit: {
          createdBy: (reply1?.handoff?.audit?.createdBy ?? ""),
          etag: (reply1?.handoff?.audit?.etag ?? ""),
        },
        owner: { displayName: (selected2_3 ?? "") },
      },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse.fromPartial({ conversation: { assignee: reply1?.handoff?.assignee } }),
      messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse.fromPartial({
        conversation: {
          assignee: { email: (reply2?.searchIndex?.owner?.email ?? "") },
          requester: { email: (reply2?.searchIndex?.owner?.email ?? "") },
        },
      }),
      messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Cancels a conversation.
   */
  async cancelConversationWorkflow(req: messagingConversationWorkflowServiceApi.CancelConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CancelConversationWorkflow", req);
    this.logger.info("cancel_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageReportingServiceApi.GenerateChatMessageReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.conversation?.customFields ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<messagingChatMessageReportingServiceApi.GenerateChatMessageReportRequest, messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse> =
      (input, done) => this.messagingChatMessageReportingClient.generateChatMessageReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: (req?.conversation?.assignee?.displayName ?? ""),
        },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(
      "acme.messaging.v1.ConversationWorkflowService/CancelConversationWorkflow:1", request2,
    );
    const request3 = messagingConversationReportingServiceApi.FetchConversationReportRequest.fromPartial({
      context: req?.context,
      conversationId: (req?.conversation?.conversationId ?? ""),
    });
    const invoke3: Unary<messagingConversationReportingServiceApi.FetchConversationReportRequest, messagingConversationReportingServiceApi.FetchConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.fetchConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<messagingConversationReportingServiceApi.FetchConversationReportRequest, messagingConversationReportingServiceApi.FetchConversationReportResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse.fromPartial({ conversation: { sla: { dueAt: reply3?.conversation?.sla?.dueAt } } }),
      messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          subject: (req?.conversation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a conversation.
   */
  async inspectConversationWorkflow(req: messagingConversationWorkflowServiceApi.InspectConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.InspectConversationWorkflowResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectConversationWorkflow", req);
    this.logger.info("inspect_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest.fromPartial({
      chatMessage: {
        correlationId: (req?.conversationId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
      },
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.delegateChatMessageApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.InspectConversationWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingConversationWorkflowServiceApi.InspectConversationWorkflowResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } }),
    );
  }

  /**
   * Pauses a conversation.
   */
  async pauseConversationWorkflow(req: messagingConversationWorkflowServiceApi.PauseConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "PauseConversationWorkflow", req);
    this.logger.info("pause_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.conversation?.comments ?? []).map(async (item) => {
      const request1 = chatHandoffApprovalServiceApi.ApproveHandoffRequest.fromPartial({
        context: req?.context,
        handoff: {
          audit: { createdAt: item?.createdAt },
          comments: [{
            authorEmail: (item?.authorEmail ?? ""),
            commentId: (item?.commentId ?? ""),
          }],
        },
      });
      const invoke1: Unary<chatHandoffApprovalServiceApi.ApproveHandoffRequest, chatHandoffApprovalServiceApi.ApproveHandoffResponse> =
        (input, done) => this.chatHandoffApprovalClient.approveHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<chatHandoffApprovalServiceApi.ApproveHandoffRequest, chatHandoffApprovalServiceApi.ApproveHandoffResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: chatHandoffApprovalServiceApi.ApproveHandoffResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({});
    const request2 = messagingConversationReportingServiceApi.DeleteConversationReportRequest.fromPartial({
      context: req?.context,
      conversationId: (req?.conversation?.conversationId ?? ""),
      etag: (reply1?.handoff?.audit?.etag ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<messagingConversationReportingServiceApi.DeleteConversationReportRequest, messagingConversationReportingServiceApi.DeleteConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.deleteConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Resumes a conversation.
   */
  async resumeConversationWorkflow(req: messagingConversationWorkflowServiceApi.ResumeConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ResumeConversationWorkflow", req);
    this.logger.info("resume_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.conversation?.origin?.$case) {
      case "customer":
        selected1_2 = ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.conversation?.origin?.$case) {
      case "customer":
        selected1_4 = ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: (selected1_4 ?? ""),
          code: (selected1_2 ?? ""),
        },
      },
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.conversation?.assignee?.displayName ?? ""),
          email: (req?.conversation?.requester?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.delegateChatMessageApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse>(invoke1, request1);
    const request2 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: (reply1?.chatMessage?.subject?.channelId ?? ""),
          displayName: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const method2 = "pushChatMessage" as const;
    const invoke2: Unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse> =
      (input, done) => this.messagingChatMessageSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          status: req?.conversation?.status,
        },
      }),
    );
  }

  /**
   * Retrys a conversation.
   */
  async retryConversationWorkflow(req: messagingConversationWorkflowServiceApi.RetryConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.RetryConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "RetryConversationWorkflow", req);
    this.logger.info("retry_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<communityForumApprovalServiceApi.RecallForumResponse>> = [];
    for (const item of (req?.conversation?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = communityForumApprovalServiceApi.RecallForumRequest.fromPartial({
          context: req?.context,
          details: { approver: { email: (item?.authorEmail ?? "") } },
          forum: {
            children: [{
              children: [{
                audit: {
                  createdAt: item?.createdAt,
                  updatedAt: req?.conversation?.audit?.updatedAt,
                  updatedBy: (req?.conversation?.audit?.updatedBy ?? ""),
                },
              }],
            }],
          },
        });
        const invoke1: Unary<communityForumApprovalServiceApi.RecallForumRequest, communityForumApprovalServiceApi.RecallForumResponse> =
          (input, done) => this.communityForumApprovalClient.recallForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<communityForumApprovalServiceApi.RecallForumRequest, communityForumApprovalServiceApi.RecallForumResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? communityForumApprovalServiceApi.RecallForumResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.forum?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (reply1?.forum?.parentId ?? ""),
        region: (reply1?.forum?.location?.region ?? ""),
      },
    });
    const proxy2 = forwarding(this.notificationsDeliveryAttemptSyncClient);
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => proxy2.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.RetryConversationWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      messagingConversationWorkflowServiceApi.RetryConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Starts a conversation.
   */
  async startConversationWorkflow(req: messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest): Promise<messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "StartConversationWorkflow", req);
    this.logger.info("start_conversation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>(invoke1, request1);
    const request2 = localizationTranslationJobApprovalServiceApi.RecallTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        origin: { $case: "customer", customer: { email: (req?.conversation?.requester?.email ?? "") } },
        requester: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<localizationTranslationJobApprovalServiceApi.RecallTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobApprovalClient.recallTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobApprovalServiceApi.RecallTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse.fromPartial({
        conversation: {
          requester: {
            email: ((reply2?.translationJob?.origin?.$case === "customer" ? reply2?.translationJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }
}
