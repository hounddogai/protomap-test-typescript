/**
 * Answers read-only questions about conversations, for screens and reports.
 */

import * as messagingConversationQueryServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ConversationQueryWorkflow } from "./conversation-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationQueryHandler {
  constructor(@inject(ConversationQueryWorkflow) private readonly workflow: ConversationQueryWorkflow) {}

  /**
   * Lists conversations a page at a time.
   */
  browseConversations = unary<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(
    (request) => this.workflow.browseConversations(request),
  );

  /**
   * Streams every matching conversation.
   */
  exportConversations = serverStream<messagingConversationQueryServiceApi.ExportConversationsRequest, messagingConversationQueryServiceApi.ExportConversationsResponse>(
    (request) => this.workflow.exportConversations(request),
  );

  /**
   * Returns a conversation.
   */
  lookupConversation = unary<messagingConversationQueryServiceApi.LookupConversationRequest, messagingConversationQueryServiceApi.LookupConversationResponse>(
    (request) => this.workflow.lookupConversation(request),
  );

  /**
   * Returns a conversation.
   */
  peekConversation = unary<messagingConversationQueryServiceApi.PeekConversationRequest, messagingConversationQueryServiceApi.PeekConversationResponse>(
    (request) => this.workflow.peekConversation(request),
  );

  /**
   * Returns several conversations at once.
   */
  resolveConversations = (call: ServerUnaryCall<messagingConversationQueryServiceApi.ResolveConversationsRequest, messagingConversationQueryServiceApi.ResolveConversationsResponse>, done: sendUnaryData<messagingConversationQueryServiceApi.ResolveConversationsResponse>): void => {
    void this.workflow.resolveConversations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists conversations a page at a time.
   */
  suggestConversations = unary<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse>(
    (request) => this.workflow.suggestConversations(request),
  );
}

export function implementation(handler: ConversationQueryHandler): messagingConversationQueryServiceApi.ConversationQueryServiceServer {
  return {
    browseConversations: handler.browseConversations,
    exportConversations: handler.exportConversations,
    lookupConversation: handler.lookupConversation,
    peekConversation: handler.peekConversation,
    resolveConversations: handler.resolveConversations,
    suggestConversations: handler.suggestConversations,
  };
}
