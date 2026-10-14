/**
 * Moves a conversation between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as bankingBankAccountQueryServiceApi from "../../../../.cache/proto/acme/banking/v1/bank_account_query_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toConversationRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationLifecycleWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.banking.v1.BankAccountQueryService") private readonly bankingBankAccountQueryClient: bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantValidationService") private readonly messagingParticipantValidationClient: messagingParticipantValidationServiceApi.ParticipantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a conversation.
   */
  async activateConversation(req: messagingConversationLifecycleServiceApi.ActivateConversationRequest): Promise<messagingConversationLifecycleServiceApi.ActivateConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateConversation", req);
    this.logger.info("activate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.SummarizeVenuesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<venuesVenueQueryServiceApi.VenueQueryServiceClient>("acme.venues.v1.VenueQueryService");
    const invoke1: Unary<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse> =
      (input, done) => client1.summarizeVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse>(invoke1, request1);
    const request2 = messagingConversationQueryServiceApi.SuggestConversationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const invoke2: Unary<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse> =
      (input, done) => this.messagingConversationQueryClient.suggestConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = messagingChannelSyncServiceApi.SyncChannelsRequest.fromPartial({
      channel: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChannelSyncServiceApi.SyncChannelsRequest, messagingChannelSyncServiceApi.SyncChannelsResponse> =
      (input, done) => this.messagingChannelSyncClient.syncChannels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<messagingChannelSyncServiceApi.SyncChannelsRequest, messagingChannelSyncServiceApi.SyncChannelsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.ActivateConversationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      messagingConversationLifecycleServiceApi.ActivateConversationResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationLifecycleServiceApi.ActivateConversationResponse.fromPartial({
        conversation: { tags: (reply3?.channel?.tags ?? []) },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      messagingConversationLifecycleServiceApi.ActivateConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a conversation.
   */
  async expireConversation(req: messagingConversationLifecycleServiceApi.ExpireConversationRequest): Promise<messagingConversationLifecycleServiceApi.ExpireConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireConversation", req);
    this.logger.info("expire_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
      context: req?.context,
      conversation: { requester: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke1: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
      (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExpireConversation.ExplainConversationCalculation", () => call<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse>(invoke1, request1));
    const request2 = messagingChatMessageSyncServiceApi.SyncChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.channelId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChatMessageSyncServiceApi.SyncChatMessagesRequest, messagingChatMessageSyncServiceApi.SyncChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.syncChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = bankingBankAccountQueryServiceApi.ResolveBankAccountsRequest.fromPartial({ context: req?.context });
    const reply3 = await this.workQueue.enqueue<bankingBankAccountQueryServiceApi.ResolveBankAccountsRequest, bankingBankAccountQueryServiceApi.ResolveBankAccountsResponse>(
      "acme.messaging.v1.ConversationLifecycleService/ExpireConversation:2", request3,
    );
    const request4 = chatHandoffApprovalServiceApi.ApproveHandoffRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      handoff: { requester: { email: (reply1?.conversation?.assignee?.email ?? "") } },
    });
    const invoke4: Unary<chatHandoffApprovalServiceApi.ApproveHandoffRequest, chatHandoffApprovalServiceApi.ApproveHandoffResponse> =
      (input, done) => this.chatHandoffApprovalClient.approveHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<chatHandoffApprovalServiceApi.ApproveHandoffRequest, chatHandoffApprovalServiceApi.ApproveHandoffResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.ExpireConversationResponse.fromPartial({
        conversation: {
          requester: {
            name: reply1?.conversation?.requester?.name,
            phone: (reply1?.conversation?.requester?.phone ?? ""),
          },
        },
      }),
      messagingConversationLifecycleServiceApi.ExpireConversationResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationLifecycleServiceApi.ExpireConversationResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      messagingConversationLifecycleServiceApi.ExpireConversationResponse.fromPartial({
        conversation: { customFields: (reply4?.handoff?.customFields ?? {}) },
        outcome: { nextSteps: (reply4?.outcome?.nextSteps ?? []) },
      }),
      messagingConversationLifecycleServiceApi.ExpireConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a conversation.
   */
  async getConversationLifecycle(req: messagingConversationLifecycleServiceApi.GetConversationLifecycleRequest): Promise<messagingConversationLifecycleServiceApi.GetConversationLifecycleResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetConversationLifecycle", req);
    this.logger.info("get_conversation_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingConversationLifecycleServiceApi.GetConversationLifecycleResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } });
  }

  /**
   * Reinstates a conversation.
   */
  async reinstateConversation(req: messagingConversationLifecycleServiceApi.ReinstateConversationRequest): Promise<messagingConversationLifecycleServiceApi.ReinstateConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateConversation", req);
    this.logger.info("reinstate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationQueryServiceApi.LookupConversationRequest.fromPartial({
      context: req?.context,
      conversationId: (req?.conversationId ?? ""),
    });
    const invoke1: Unary<messagingConversationQueryServiceApi.LookupConversationRequest, messagingConversationQueryServiceApi.LookupConversationResponse> =
      (input, done) => this.messagingConversationQueryClient.lookupConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingConversationQueryServiceApi.LookupConversationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = messagingChatMessageSyncServiceApi.PullChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: {
          code: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: (req?.details?.newOwner?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pullChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        audit: { updatedBy: (reply1?.conversation?.audit?.updatedBy ?? "") },
        owner: {
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.ReinstateConversationResponse.fromPartial({ conversation: { status: reply1?.conversation?.status } }),
      messagingConversationLifecycleServiceApi.ReinstateConversationResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      messagingConversationLifecycleServiceApi.ReinstateConversationResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      messagingConversationLifecycleServiceApi.ReinstateConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a conversation.
   */
  async renewConversation(req: messagingConversationLifecycleServiceApi.RenewConversationRequest): Promise<messagingConversationLifecycleServiceApi.RenewConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewConversation", req);
    this.logger.info("renew_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantValidationServiceApi.NormalizeParticipantRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      participant: {
        contact: { phone: (req?.details?.notifyContact?.phone ?? "") },
        relationshipManager: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const method1 = "normalizeParticipant" as const;
    const invoke1: Unary<messagingParticipantValidationServiceApi.NormalizeParticipantRequest, messagingParticipantValidationServiceApi.NormalizeParticipantResponse> =
      (input, done) => this.messagingParticipantValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantValidationServiceApi.NormalizeParticipantRequest, messagingParticipantValidationServiceApi.NormalizeParticipantResponse>(invoke1, request1);
    const request2 = messagingChatMessageSyncServiceApi.PullChatMessagesRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((reply1?.participant?.attributes ?? {}))),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.messagingChatMessageSyncClient);
    const invoke2: Unary<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse> =
      (input, done) => proxy2.pullChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse>(invoke2, request2);
    const request3 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      chatMessage: {
        kind: (reply2?.chatMessage?.kind ?? ""),
        subject: {
          channelId: (reply2?.chatMessage?.subject?.channelId ?? ""),
          code: (reply2?.chatMessage?.subject?.code ?? ""),
          displayName: (req?.details?.newOwner?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> =
      (input, done) => this.messagingChatMessageSyncClient.resolveChatMessageConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>(invoke3, request3);
    const request4 = messagingChatMessageSyncServiceApi.StreamChatMessageChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream4 = this.messagingChatMessageSyncClient.streamChatMessageChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.RenewConversationResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      messagingConversationLifecycleServiceApi.RenewConversationResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      messagingConversationLifecycleServiceApi.RenewConversationResponse.fromPartial({
        outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      messagingConversationLifecycleServiceApi.RenewConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a conversation.
   */
  async scheduleConversationExpiry(req: messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest): Promise<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ScheduleConversationExpiry", req);
    this.logger.info("schedule_conversation_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.PreviewConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: { etag: (req?.conversation?.audit?.etag ?? "") },
        origin: { $case: "channel", channel: {
          address: ((req?.conversation?.origin?.$case === "channel" ? req?.conversation?.origin.channel : undefined)?.address ?? ""),
        } },
        requester: { phone: (req?.conversation?.requester?.phone ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.previewConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingConversationQueryServiceApi.LookupConversationRequest.fromPartial({
      context: input2?.context,
      conversationId: (input2?.conversationId ?? ""),
    });
    const invoke2: Unary<messagingConversationQueryServiceApi.LookupConversationRequest, messagingConversationQueryServiceApi.LookupConversationResponse> =
      (input, done) => this.messagingConversationQueryClient.lookupConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationQueryServiceApi.LookupConversationRequest, messagingConversationQueryServiceApi.LookupConversationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse.fromPartial({ conversation: { sla: { dueAt: reply1?.conversation?.sla?.dueAt } } }),
      messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse.fromPartial({
        conversation: { audit: { createdBy: (reply2?.conversation?.audit?.createdBy ?? "") } },
      }),
      messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a conversation.
   */
  async suspendConversation(req: messagingConversationLifecycleServiceApi.SuspendConversationRequest): Promise<messagingConversationLifecycleServiceApi.SuspendConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendConversation", req);
    this.logger.info("suspend_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.CountConversationTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const cloned1: messagingConversationReportingServiceApi.CountConversationTotalsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingConversationReportingServiceApi.CountConversationTotalsRequest, messagingConversationReportingServiceApi.CountConversationTotalsResponse> =
      (input, done) => this.messagingConversationReportingClient.countConversationTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationReportingServiceApi.CountConversationTotalsRequest, messagingConversationReportingServiceApi.CountConversationTotalsResponse>(invoke1, cloned1);
    const request2 = notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const decoded2 = notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.listSubscriptionWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse>(invoke2, decoded2);
    const request3 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        requester: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ScoreConversationRequest",
      value: Buffer.from(messagingConversationValidationServiceApi.ScoreConversationRequest.encode(request3).finish()),
    });
    const unpacked3 = messagingConversationValidationServiceApi.ScoreConversationRequest.decode(envelope3.value);
    const invoke3: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke3, unpacked3);
    const request4 = messagingConversationQueryServiceApi.ExportConversationsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply3?.conversation?.audit?.createdAt },
    });
    const stream4 = this.messagingConversationQueryClient.exportConversations(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? messagingConversationQueryServiceApi.ExportConversationsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.SuspendConversationResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingConversationLifecycleServiceApi.SuspendConversationResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationLifecycleServiceApi.SuspendConversationResponse.fromPartial({
        conversation: { assignee: { email: (reply3?.conversation?.assignee?.email ?? "") } },
      }),
      messagingConversationLifecycleServiceApi.SuspendConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a conversation.
   */
  async terminateConversation(req: messagingConversationLifecycleServiceApi.TerminateConversationRequest): Promise<messagingConversationLifecycleServiceApi.TerminateConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateConversation", req);
    this.logger.info("terminate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        requester: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const client1 = this.clients.get<messagingConversationValidationServiceApi.ConversationValidationServiceClient>("acme.messaging.v1.ConversationValidationService");
    const invoke1: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => client1.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke1, request1);
    const request2 = authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest.fromPartial({
      accessPolicy: {
        audit: { updatedBy: (reply1?.conversation?.audit?.updatedBy ?? "") },
        owner: { userId: (req?.details?.newOwner?.userId ?? "") },
      },
      context: req?.context,
      details: { contact: { phone: (reply1?.conversation?.requester?.phone ?? "") } },
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.explainAccessPolicyDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationLifecycleServiceApi.TerminateConversationResponse.fromPartial({
        conversation: { customFields: (reply1?.conversation?.customFields ?? {}) },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      messagingConversationLifecycleServiceApi.TerminateConversationResponse.fromPartial({
        conversation: { audit: { etag: (reply2?.accessPolicy?.audit?.etag ?? "") } },
      }),
      messagingConversationLifecycleServiceApi.TerminateConversationResponse.fromPartial({
        conversation: { conversationId: (req?.conversationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ConversationLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationLifecycleHandler {
  constructor(@inject(ConversationLifecycleWorkflow) private readonly workflow: ConversationLifecycleWorkflow) {}

  /**
   * Activates a conversation.
   */
  activateConversation = unary<messagingConversationLifecycleServiceApi.ActivateConversationRequest, messagingConversationLifecycleServiceApi.ActivateConversationResponse>(
    (request) => this.workflow.activateConversation(request),
  );

  /**
   * Expires a conversation.
   */
  expireConversation = unary<messagingConversationLifecycleServiceApi.ExpireConversationRequest, messagingConversationLifecycleServiceApi.ExpireConversationResponse>(
    (request) => this.workflow.expireConversation(request),
  );

  /**
   * Returns a conversation.
   */
  getConversationLifecycle = (call: ServerUnaryCall<messagingConversationLifecycleServiceApi.GetConversationLifecycleRequest, messagingConversationLifecycleServiceApi.GetConversationLifecycleResponse>, done: sendUnaryData<messagingConversationLifecycleServiceApi.GetConversationLifecycleResponse>): void => {
    void this.workflow.getConversationLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a conversation.
   */
  reinstateConversation = unary<messagingConversationLifecycleServiceApi.ReinstateConversationRequest, messagingConversationLifecycleServiceApi.ReinstateConversationResponse>(
    (request) => this.workflow.reinstateConversation(request),
  );

  /**
   * Renews a conversation.
   */
  renewConversation = unary<messagingConversationLifecycleServiceApi.RenewConversationRequest, messagingConversationLifecycleServiceApi.RenewConversationResponse>(
    (request) => this.workflow.renewConversation(request),
  );

  /**
   * Schedules a conversation.
   */
  scheduleConversationExpiry = (call: ServerUnaryCall<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse>, done: sendUnaryData<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse>): void => {
    void this.workflow.scheduleConversationExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a conversation.
   */
  suspendConversation = unary<messagingConversationLifecycleServiceApi.SuspendConversationRequest, messagingConversationLifecycleServiceApi.SuspendConversationResponse>(
    (request) => this.workflow.suspendConversation(request),
  );

  /**
   * Terminates a conversation.
   */
  terminateConversation = unary<messagingConversationLifecycleServiceApi.TerminateConversationRequest, messagingConversationLifecycleServiceApi.TerminateConversationResponse>(
    (request) => this.workflow.terminateConversation(request),
  );
}

export function implementation(handler: ConversationLifecycleHandler): messagingConversationLifecycleServiceApi.ConversationLifecycleServiceServer {
  return {
    activateConversation: handler.activateConversation,
    expireConversation: handler.expireConversation,
    getConversationLifecycle: handler.getConversationLifecycle,
    reinstateConversation: handler.reinstateConversation,
    renewConversation: handler.renewConversation,
    scheduleConversationExpiry: handler.scheduleConversationExpiry,
    suspendConversation: handler.suspendConversation,
    terminateConversation: handler.terminateConversation,
  };
}
