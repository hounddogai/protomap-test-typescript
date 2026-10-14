/**
 * Answers read-only questions about conversations, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as keymanagementCryptoKeyQueryServiceApi from "../../../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as messagingChannelValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, operation, promised, retry, type Unary, workflow } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationQueryWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyQueryService") private readonly keymanagementCryptoKeyQueryClient: keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists conversations a page at a time.
   */
  async browseConversations(req: messagingConversationQueryServiceApi.BrowseConversationsRequest): Promise<messagingConversationQueryServiceApi.BrowseConversationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseConversations", req);
    this.logger.info("browse_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.PreviewChatMessageRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const invoke1: Unary<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.previewChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationQueryServiceApi.BrowseConversationsResponse.fromPartial({
      conversations: [{
        assignee: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
      }],
      result: { correlationId: (reply1?.chatMessage?.correlationId ?? "") },
    });
  }

  /**
   * Streams every matching conversation.
   */
  async exportConversations(req: messagingConversationQueryServiceApi.ExportConversationsRequest): Promise<messagingConversationQueryServiceApi.ExportConversationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportConversations", req);
    this.logger.info("export_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExportConversations.ListDeliveryAttemptConflicts", () => call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke1, request1));
    const request2 = messagingChatMessageValidationServiceApi.PreviewChatMessageRequest.fromPartial({
      chatMessage: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        occurredAt: req?.filter?.createdAfter,
      },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke2: Unary<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.previewChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      messagingConversationQueryServiceApi.ExportConversationsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationQueryServiceApi.ExportConversationsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
    );
  }

  /**
   * Returns a conversation.
   */
  async lookupConversation(req: messagingConversationQueryServiceApi.LookupConversationRequest): Promise<messagingConversationQueryServiceApi.LookupConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupConversation", req);
    this.logger.info("lookup_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest.fromPartial({ context: req?.context });
    const reply1 = await this.workQueue.enqueue<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse>(
      "acme.messaging.v1.ConversationQueryService/LookupConversation:0", request1,
    );
    return mergeResponses(
      messagingConversationQueryServiceApi.LookupConversationResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingConversationQueryServiceApi.LookupConversationResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } }),
    );
  }

  /**
   * Returns a conversation.
   */
  async peekConversation(req: messagingConversationQueryServiceApi.PeekConversationRequest): Promise<messagingConversationQueryServiceApi.PeekConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekConversation", req);
    this.logger.info("peek_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelValidationServiceApi.ValidateChannelRequest.fromPartial({
      channel: {
        components: { primary: { componentId: (req?.conversationId ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.validateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse>(invoke1, request1));
    const request2 = keymanagementCryptoKeyQueryServiceApi.ExportCryptoKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.channel?.audit?.createdAt,
        region: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream2 = this.keymanagementCryptoKeyQueryClient.exportCryptoKeys(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? keymanagementCryptoKeyQueryServiceApi.ExportCryptoKeysResponse.fromPartial({});
    return mergeResponses(
      messagingConversationQueryServiceApi.PeekConversationResponse.fromPartial({
        conversation: {
          audit: { updatedBy: (reply1?.channel?.audit?.updatedBy ?? "") },
          comments: [{ createdAt: reply1?.channel?.audit?.createdAt }],
        },
      }),
      messagingConversationQueryServiceApi.PeekConversationResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } }),
    );
  }

  /**
   * Returns several conversations at once.
   */
  async resolveConversations(req: messagingConversationQueryServiceApi.ResolveConversationsRequest): Promise<messagingConversationQueryServiceApi.ResolveConversationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveConversations", req);
    this.logger.info("resolve_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      participant: {
        identityDocument: { $case: "passport", passport: { expiresAt: req?.context?.deadline } },
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest, messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse> =
      (input, done) => this.messagingParticipantCalculationClient.explainParticipantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return messagingConversationQueryServiceApi.ResolveConversationsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Lists conversations a page at a time.
   */
  async suggestConversations(req: messagingConversationQueryServiceApi.SuggestConversationsRequest): Promise<messagingConversationQueryServiceApi.SuggestConversationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestConversations", req);
    this.logger.info("suggest_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ScoreChatMessageRequest.fromPartial({
      chatMessage: { occurredAt: req?.filter?.createdAfter },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.scoreChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationQueryServiceApi.SuggestConversationsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }
}
