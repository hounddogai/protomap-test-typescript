/**
 * Answers read-only questions about chat messages, for screens and reports.
 */

import * as messagingChatMessageQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatMessageQueryWorkflow } from "../application/chat-message-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatMessageQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageQueryHandler {
  constructor(@inject(ChatMessageQueryWorkflow) private readonly workflow: ChatMessageQueryWorkflow) {}

  /**
   * Lists chat messages a page at a time.
   */
  browseChatMessages = (call: ServerUnaryCall<messagingChatMessageQueryServiceApi.BrowseChatMessagesRequest, messagingChatMessageQueryServiceApi.BrowseChatMessagesResponse>, done: sendUnaryData<messagingChatMessageQueryServiceApi.BrowseChatMessagesResponse>): void => {
    void this.workflow.browseChatMessages(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts chat messages by status.
   */
  countChatMessages = unary<messagingChatMessageQueryServiceApi.CountChatMessagesRequest, messagingChatMessageQueryServiceApi.CountChatMessagesResponse>(
    (request) => this.workflow.countChatMessages(request),
  );

  /**
   * Lists chat messages a page at a time.
   */
  findChatMessages = unary<messagingChatMessageQueryServiceApi.FindChatMessagesRequest, messagingChatMessageQueryServiceApi.FindChatMessagesResponse>(
    (request) => this.workflow.findChatMessages(request),
  );

  /**
   * Returns a chat message.
   */
  lookupChatMessage = (call: ServerUnaryCall<messagingChatMessageQueryServiceApi.LookupChatMessageRequest, messagingChatMessageQueryServiceApi.LookupChatMessageResponse>, done: sendUnaryData<messagingChatMessageQueryServiceApi.LookupChatMessageResponse>): void => {
    void this.workflow.lookupChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns several chat messages at once.
   */
  resolveChatMessages = unary<messagingChatMessageQueryServiceApi.ResolveChatMessagesRequest, messagingChatMessageQueryServiceApi.ResolveChatMessagesResponse>(
    (request) => this.workflow.resolveChatMessages(request),
  );

  /**
   * Lists chat messages a page at a time.
   */
  suggestChatMessages = unary<messagingChatMessageQueryServiceApi.SuggestChatMessagesRequest, messagingChatMessageQueryServiceApi.SuggestChatMessagesResponse>(
    (request) => this.workflow.suggestChatMessages(request),
  );

  /**
   * Summarizes a chat message.
   */
  summarizeChatMessages = (call: ServerUnaryCall<messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest, messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse>, done: sendUnaryData<messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse>): void => {
    void this.workflow.summarizeChatMessages(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ChatMessageQueryHandler): messagingChatMessageQueryServiceApi.ChatMessageQueryServiceServer {
  return {
    browseChatMessages: handler.browseChatMessages,
    countChatMessages: handler.countChatMessages,
    findChatMessages: handler.findChatMessages,
    lookupChatMessage: handler.lookupChatMessage,
    resolveChatMessages: handler.resolveChatMessages,
    suggestChatMessages: handler.suggestChatMessages,
    summarizeChatMessages: handler.summarizeChatMessages,
  };
}
