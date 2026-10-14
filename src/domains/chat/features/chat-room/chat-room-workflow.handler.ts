/**
 * Runs the long-lived workflow that takes a chat room from start to finish.
 */

import * as chatChatRoomWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChatRoomWorkflowWorkflow } from "./chat-room-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatRoomWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomWorkflowHandler {
  constructor(@inject(ChatRoomWorkflowWorkflow) private readonly workflow: ChatRoomWorkflowWorkflow) {}

  /**
   * Advances a chat room.
   */
  advanceChatRoomWorkflow = unary<chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse>(
    (request) => this.workflow.advanceChatRoomWorkflow(request),
  );

  /**
   * Cancels a chat room.
   */
  cancelChatRoomWorkflow = (call: ServerUnaryCall<chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse>, done: sendUnaryData<chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse>): void => {
    void this.workflow.cancelChatRoomWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a chat room.
   */
  inspectChatRoomWorkflow = unary<chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowResponse>(
    (request) => this.workflow.inspectChatRoomWorkflow(request),
  );

  /**
   * Lists chat rooms a page at a time.
   */
  listChatRoomWorkflows = unary<chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsRequest, chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsResponse>(
    (request) => this.workflow.listChatRoomWorkflows(request),
  );

  /**
   * Pauses a chat room.
   */
  pauseChatRoomWorkflow = (call: ServerUnaryCall<chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse>, done: sendUnaryData<chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse>): void => {
    void this.workflow.pauseChatRoomWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a chat room.
   */
  resumeChatRoomWorkflow = unary<chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse>(
    (request) => this.workflow.resumeChatRoomWorkflow(request),
  );

  /**
   * Retrys a chat room.
   */
  retryChatRoomWorkflow = unary<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse>(
    (request) => this.workflow.retryChatRoomWorkflow(request),
  );

  /**
   * Signals a chat room.
   */
  signalChatRoomWorkflow = (call: ServerUnaryCall<chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse>, done: sendUnaryData<chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse>): void => {
    void this.workflow.signalChatRoomWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a chat room.
   */
  startChatRoomWorkflow = unary<chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse>(
    (request) => this.workflow.startChatRoomWorkflow(request),
  );
}

export function implementation(handler: ChatRoomWorkflowHandler): chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceServer {
  return {
    advanceChatRoomWorkflow: handler.advanceChatRoomWorkflow,
    cancelChatRoomWorkflow: handler.cancelChatRoomWorkflow,
    inspectChatRoomWorkflow: handler.inspectChatRoomWorkflow,
    listChatRoomWorkflows: handler.listChatRoomWorkflows,
    pauseChatRoomWorkflow: handler.pauseChatRoomWorkflow,
    resumeChatRoomWorkflow: handler.resumeChatRoomWorkflow,
    retryChatRoomWorkflow: handler.retryChatRoomWorkflow,
    signalChatRoomWorkflow: handler.signalChatRoomWorkflow,
    startChatRoomWorkflow: handler.startChatRoomWorkflow,
  };
}
