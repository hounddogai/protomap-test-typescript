/**
 * Moves a chat message between the states of its lifecycle.
 */

import * as messagingChatMessageLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChatMessageLifecycleWorkflow } from "./chat-message-lifecycle.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatMessageLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageLifecycleHandler {
  constructor(@inject(ChatMessageLifecycleWorkflow) private readonly workflow: ChatMessageLifecycleWorkflow) {}

  /**
   * Activates a chat message.
   */
  activateChatMessage = unary<messagingChatMessageLifecycleServiceApi.ActivateChatMessageRequest, messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse>(
    (request) => this.workflow.activateChatMessage(request),
  );

  /**
   * Expires a chat message.
   */
  expireChatMessage = (call: ServerUnaryCall<messagingChatMessageLifecycleServiceApi.ExpireChatMessageRequest, messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse>, done: sendUnaryData<messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse>): void => {
    void this.workflow.expireChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a chat message.
   */
  getChatMessageLifecycle = unary<messagingChatMessageLifecycleServiceApi.GetChatMessageLifecycleRequest, messagingChatMessageLifecycleServiceApi.GetChatMessageLifecycleResponse>(
    (request) => this.workflow.getChatMessageLifecycle(request),
  );

  /**
   * Reinstates a chat message.
   */
  reinstateChatMessage = unary<messagingChatMessageLifecycleServiceApi.ReinstateChatMessageRequest, messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse>(
    (request) => this.workflow.reinstateChatMessage(request),
  );

  /**
   * Renews a chat message.
   */
  renewChatMessage = (call: ServerUnaryCall<messagingChatMessageLifecycleServiceApi.RenewChatMessageRequest, messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse>, done: sendUnaryData<messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse>): void => {
    void this.workflow.renewChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a chat message.
   */
  scheduleChatMessageExpiry = unary<messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryRequest, messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryResponse>(
    (request) => this.workflow.scheduleChatMessageExpiry(request),
  );

  /**
   * Suspends a chat message.
   */
  suspendChatMessage = unary<messagingChatMessageLifecycleServiceApi.SuspendChatMessageRequest, messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse>(
    (request) => this.workflow.suspendChatMessage(request),
  );
}

export function implementation(handler: ChatMessageLifecycleHandler): messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceServer {
  return {
    activateChatMessage: handler.activateChatMessage,
    expireChatMessage: handler.expireChatMessage,
    getChatMessageLifecycle: handler.getChatMessageLifecycle,
    reinstateChatMessage: handler.reinstateChatMessage,
    renewChatMessage: handler.renewChatMessage,
    scheduleChatMessageExpiry: handler.scheduleChatMessageExpiry,
    suspendChatMessage: handler.suspendChatMessage,
  };
}
