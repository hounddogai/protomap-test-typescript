/**
 * Routes chat rooms through approval, with escalation and delegation.
 */

import * as chatChatRoomApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChatRoomApprovalWorkflow } from "./chat-room-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatRoomApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomApprovalHandler {
  constructor(@inject(ChatRoomApprovalWorkflow) private readonly workflow: ChatRoomApprovalWorkflow) {}

  /**
   * Approves a chat room.
   */
  approveChatRoom = unary<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse>(
    (request) => this.workflow.approveChatRoom(request),
  );

  /**
   * Comments a chat room.
   */
  commentChatRoomApproval = (call: ServerUnaryCall<chatChatRoomApprovalServiceApi.CommentChatRoomApprovalRequest, chatChatRoomApprovalServiceApi.CommentChatRoomApprovalResponse>, done: sendUnaryData<chatChatRoomApprovalServiceApi.CommentChatRoomApprovalResponse>): void => {
    void this.workflow.commentChatRoomApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a chat room.
   */
  delegateChatRoomApproval = unary<chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalRequest, chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse>(
    (request) => this.workflow.delegateChatRoomApproval(request),
  );

  /**
   * Returns a chat room.
   */
  getChatRoomApprovalStatus = unary<chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusRequest, chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusResponse>(
    (request) => this.workflow.getChatRoomApprovalStatus(request),
  );

  /**
   * Lists chat rooms a page at a time.
   */
  listPendingChatRooms = (call: ServerUnaryCall<chatChatRoomApprovalServiceApi.ListPendingChatRoomsRequest, chatChatRoomApprovalServiceApi.ListPendingChatRoomsResponse>, done: sendUnaryData<chatChatRoomApprovalServiceApi.ListPendingChatRoomsResponse>): void => {
    void this.workflow.listPendingChatRooms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a chat room.
   */
  recallChatRoom = unary<chatChatRoomApprovalServiceApi.RecallChatRoomRequest, chatChatRoomApprovalServiceApi.RecallChatRoomResponse>(
    (request) => this.workflow.recallChatRoom(request),
  );

  /**
   * Rejects a chat room.
   */
  rejectChatRoom = unary<chatChatRoomApprovalServiceApi.RejectChatRoomRequest, chatChatRoomApprovalServiceApi.RejectChatRoomResponse>(
    (request) => this.workflow.rejectChatRoom(request),
  );

  /**
   * Submits a chat room.
   */
  submitChatRoom = (call: ServerUnaryCall<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse>, done: sendUnaryData<chatChatRoomApprovalServiceApi.SubmitChatRoomResponse>): void => {
    void this.workflow.submitChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ChatRoomApprovalHandler): chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceServer {
  return {
    approveChatRoom: handler.approveChatRoom,
    commentChatRoomApproval: handler.commentChatRoomApproval,
    delegateChatRoomApproval: handler.delegateChatRoomApproval,
    getChatRoomApprovalStatus: handler.getChatRoomApprovalStatus,
    listPendingChatRooms: handler.listPendingChatRooms,
    recallChatRoom: handler.recallChatRoom,
    rejectChatRoom: handler.rejectChatRoom,
    submitChatRoom: handler.submitChatRoom,
  };
}
