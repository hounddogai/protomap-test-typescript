/**
 * Keeps chat messages in step with the systems of record in other regions.
 */

import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { duplex, unary } from "../../../../platform/handlers.js";
import { ChatMessageSyncWorkflow } from "./chat-message-sync.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatMessageSyncService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageSyncHandler {
  constructor(@inject(ChatMessageSyncWorkflow) private readonly workflow: ChatMessageSyncWorkflow) {}

  /**
   * Lists chat messages a page at a time.
   */
  listChatMessageConflicts = unary<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse>(
    (request) => this.workflow.listChatMessageConflicts(request),
  );

  /**
   * Pulls a chat message.
   */
  pullChatMessages = (call: ServerUnaryCall<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse>, done: sendUnaryData<messagingChatMessageSyncServiceApi.PullChatMessagesResponse>): void => {
    void this.workflow.pullChatMessages(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pushs a chat message.
   */
  pushChatMessage = unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(
    (request) => this.workflow.pushChatMessage(request),
  );

  /**
   * Reconciles a chat message.
   */
  reconcileChatMessages = unary<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse>(
    (request) => this.workflow.reconcileChatMessages(request),
  );

  /**
   * Resolves a chat message.
   */
  resolveChatMessageConflict = (call: ServerUnaryCall<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>, done: sendUnaryData<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>): void => {
    void this.workflow.resolveChatMessageConflict(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Exchanges changes of chat messages with a peer.
   */
  streamChatMessageChanges = duplex<messagingChatMessageSyncServiceApi.StreamChatMessageChangesRequest, messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse>(
    (request) => this.workflow.streamChatMessageChanges(request),
  );

  /**
   * Syncs a chat message.
   */
  syncChatMessages = unary<messagingChatMessageSyncServiceApi.SyncChatMessagesRequest, messagingChatMessageSyncServiceApi.SyncChatMessagesResponse>(
    (request) => this.workflow.syncChatMessages(request),
  );
}

export function implementation(handler: ChatMessageSyncHandler): messagingChatMessageSyncServiceApi.ChatMessageSyncServiceServer {
  return {
    listChatMessageConflicts: handler.listChatMessageConflicts,
    pullChatMessages: handler.pullChatMessages,
    pushChatMessage: handler.pushChatMessage,
    reconcileChatMessages: handler.reconcileChatMessages,
    resolveChatMessageConflict: handler.resolveChatMessageConflict,
    streamChatMessageChanges: handler.streamChatMessageChanges,
    syncChatMessages: handler.syncChatMessages,
  };
}
