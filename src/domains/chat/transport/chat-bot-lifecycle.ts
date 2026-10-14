/**
 * Moves a chat bot between the states of its lifecycle.
 */

import * as chatChatBotLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatBotLifecycleWorkflow } from "../application/chat-bot-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatBotLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotLifecycleHandler {
  constructor(@inject(ChatBotLifecycleWorkflow) private readonly workflow: ChatBotLifecycleWorkflow) {}

  /**
   * Activates a chat bot.
   */
  activateChatBot = (call: ServerUnaryCall<chatChatBotLifecycleServiceApi.ActivateChatBotRequest, chatChatBotLifecycleServiceApi.ActivateChatBotResponse>, done: sendUnaryData<chatChatBotLifecycleServiceApi.ActivateChatBotResponse>): void => {
    void this.workflow.activateChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a chat bot.
   */
  expireChatBot = unary<chatChatBotLifecycleServiceApi.ExpireChatBotRequest, chatChatBotLifecycleServiceApi.ExpireChatBotResponse>(
    (request) => this.workflow.expireChatBot(request),
  );

  /**
   * Returns a chat bot.
   */
  getChatBotLifecycle = unary<chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest, chatChatBotLifecycleServiceApi.GetChatBotLifecycleResponse>(
    (request) => this.workflow.getChatBotLifecycle(request),
  );

  /**
   * Reinstates a chat bot.
   */
  reinstateChatBot = (call: ServerUnaryCall<chatChatBotLifecycleServiceApi.ReinstateChatBotRequest, chatChatBotLifecycleServiceApi.ReinstateChatBotResponse>, done: sendUnaryData<chatChatBotLifecycleServiceApi.ReinstateChatBotResponse>): void => {
    void this.workflow.reinstateChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a chat bot.
   */
  renewChatBot = unary<chatChatBotLifecycleServiceApi.RenewChatBotRequest, chatChatBotLifecycleServiceApi.RenewChatBotResponse>(
    (request) => this.workflow.renewChatBot(request),
  );

  /**
   * Schedules a chat bot.
   */
  scheduleChatBotExpiry = unary<chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest, chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse>(
    (request) => this.workflow.scheduleChatBotExpiry(request),
  );

  /**
   * Suspends a chat bot.
   */
  suspendChatBot = (call: ServerUnaryCall<chatChatBotLifecycleServiceApi.SuspendChatBotRequest, chatChatBotLifecycleServiceApi.SuspendChatBotResponse>, done: sendUnaryData<chatChatBotLifecycleServiceApi.SuspendChatBotResponse>): void => {
    void this.workflow.suspendChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a chat bot.
   */
  terminateChatBot = unary<chatChatBotLifecycleServiceApi.TerminateChatBotRequest, chatChatBotLifecycleServiceApi.TerminateChatBotResponse>(
    (request) => this.workflow.terminateChatBot(request),
  );
}

export function implementation(handler: ChatBotLifecycleHandler): chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceServer {
  return {
    activateChatBot: handler.activateChatBot,
    expireChatBot: handler.expireChatBot,
    getChatBotLifecycle: handler.getChatBotLifecycle,
    reinstateChatBot: handler.reinstateChatBot,
    renewChatBot: handler.renewChatBot,
    scheduleChatBotExpiry: handler.scheduleChatBotExpiry,
    suspendChatBot: handler.suspendChatBot,
    terminateChatBot: handler.terminateChatBot,
  };
}
