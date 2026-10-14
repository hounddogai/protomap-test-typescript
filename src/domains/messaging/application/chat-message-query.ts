/**
 * Answers read-only questions about chat messages, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as searchSearchIndexServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, operation, promised, retry, type Unary, workflow } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageQueryWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists chat messages a page at a time.
   */
  async browseChatMessages(req: messagingChatMessageQueryServiceApi.BrowseChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.BrowseChatMessagesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseChatMessages", req);
    this.logger.info("browse_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexServiceApi.BatchGetSearchIndexesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<searchSearchIndexServiceApi.BatchGetSearchIndexesRequest, searchSearchIndexServiceApi.BatchGetSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexClient.batchGetSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<searchSearchIndexServiceApi.BatchGetSearchIndexesRequest, searchSearchIndexServiceApi.BatchGetSearchIndexesResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageQueryServiceApi.BrowseChatMessagesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Counts chat messages by status.
   */
  async countChatMessages(req: messagingChatMessageQueryServiceApi.CountChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.CountChatMessagesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountChatMessages", req);
    this.logger.info("count_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageQueryServiceApi.CountChatMessagesResponse.fromPartial({});
  }

  /**
   * Lists chat messages a page at a time.
   */
  async findChatMessages(req: messagingChatMessageQueryServiceApi.FindChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.FindChatMessagesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindChatMessages", req);
    this.logger.info("find_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.SimulateChatBotRequest.fromPartial({
      chatBot: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.simulateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("FindChatMessages.SimulateChatBot", () => call<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageQueryServiceApi.FindChatMessagesResponse.fromPartial({
      chatMessages: [{ subject: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") } }],
      result: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
  }

  /**
   * Returns a chat message.
   */
  async lookupChatMessage(req: messagingChatMessageQueryServiceApi.LookupChatMessageRequest): Promise<messagingChatMessageQueryServiceApi.LookupChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupChatMessage", req);
    this.logger.info("lookup_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromPartial({
      chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
      context: req?.context,
    });
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> =
      (input, done) => this.messagingChatMessageValidationClient.explainChatMessageDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return messagingChatMessageQueryServiceApi.LookupChatMessageResponse.fromPartial({
      chatMessage: { chatMessageId: (reply1?.chatMessage?.chatMessageId ?? "") },
    });
  }

  /**
   * Returns several chat messages at once.
   */
  async resolveChatMessages(req: messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.ResolveChatMessagesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveChatMessages", req);
    this.logger.info("resolve_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingChatMessageQueryServiceApi.ResolveChatMessagesResponse.fromPartial({});
  }

  /**
   * Lists chat messages a page at a time.
   */
  async suggestChatMessages(req: messagingChatMessageQueryServiceApi.SuggestChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.SuggestChatMessagesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestChatMessages", req);
    this.logger.info("suggest_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ValidateChatMessageRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        measurements: [{ observedAt: req?.filter?.createdAfter }],
      },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>(
      "acme.messaging.v1.ChatMessageQueryService/SuggestChatMessages:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageQueryServiceApi.SuggestChatMessagesResponse.fromPartial({
      chatMessages: [{ chatMessageId: (reply1?.chatMessage?.chatMessageId ?? "") }],
    });
  }

  /**
   * Summarizes a chat message.
   */
  async summarizeChatMessages(req: messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest): Promise<messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeChatMessages", req);
    this.logger.info("summarize_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationQueryServiceApi.ExportConversationsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
      },
      format: (req?.details?.format ?? ""),
    });
    const stream1 = this.messagingConversationQueryClient.exportConversations(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? messagingConversationQueryServiceApi.ExportConversationsResponse.fromPartial({});
    const request2 = messagingChannelCalculationServiceApi.RecalculateChannelsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke2: Unary<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse> =
      (input, done) => this.messagingChannelCalculationClient.recalculateChannels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse>(invoke2, request2));
    const request3 = experimentsVariantQueryServiceApi.FindVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.channel?.audit?.createdAt,
        region: ((reply2?.channel?.locator?.$case === "address" ? reply2?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.findVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<experimentsVariantQueryServiceApi.FindVariantsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = messagingChatMessageValidationServiceApi.LintChatMessagesRequest.fromPartial({
      chatMessage: { measurements: [{ unit: (reply2?.channel?.dimensions?.unit ?? "") }] },
      context: req?.context,
    });
    const invoke4: Unary<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse> =
      (input, done) => this.messagingChatMessageValidationClient.lintChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
