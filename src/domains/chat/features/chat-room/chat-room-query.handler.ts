/**
 * Answers read-only questions about chat rooms, for screens and reports.
 */

import * as chatChatRoomQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ChatRoomQueryWorkflow } from "./chat-room-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatRoomQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomQueryHandler {
  constructor(@inject(ChatRoomQueryWorkflow) private readonly workflow: ChatRoomQueryWorkflow) {}

  /**
   * Lists chat rooms a page at a time.
   */
  browseChatRooms = unary<chatChatRoomQueryServiceApi.BrowseChatRoomsRequest, chatChatRoomQueryServiceApi.BrowseChatRoomsResponse>(
    (request) => this.workflow.browseChatRooms(request),
  );

  /**
   * Counts chat rooms by status.
   */
  countChatRooms = (call: ServerUnaryCall<chatChatRoomQueryServiceApi.CountChatRoomsRequest, chatChatRoomQueryServiceApi.CountChatRoomsResponse>, done: sendUnaryData<chatChatRoomQueryServiceApi.CountChatRoomsResponse>): void => {
    void this.workflow.countChatRooms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching chat room.
   */
  exportChatRooms = serverStream<chatChatRoomQueryServiceApi.ExportChatRoomsRequest, chatChatRoomQueryServiceApi.ExportChatRoomsResponse>(
    (request) => this.workflow.exportChatRooms(request),
  );

  /**
   * Lists chat rooms a page at a time.
   */
  findChatRooms = unary<chatChatRoomQueryServiceApi.FindChatRoomsRequest, chatChatRoomQueryServiceApi.FindChatRoomsResponse>(
    (request) => this.workflow.findChatRooms(request),
  );

  /**
   * Returns a chat room.
   */
  lookupChatRoom = (call: ServerUnaryCall<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse>, done: sendUnaryData<chatChatRoomQueryServiceApi.LookupChatRoomResponse>): void => {
    void this.workflow.lookupChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a chat room.
   */
  peekChatRoom = unary<chatChatRoomQueryServiceApi.PeekChatRoomRequest, chatChatRoomQueryServiceApi.PeekChatRoomResponse>(
    (request) => this.workflow.peekChatRoom(request),
  );

  /**
   * Returns several chat rooms at once.
   */
  resolveChatRooms = unary<chatChatRoomQueryServiceApi.ResolveChatRoomsRequest, chatChatRoomQueryServiceApi.ResolveChatRoomsResponse>(
    (request) => this.workflow.resolveChatRooms(request),
  );

  /**
   * Lists chat rooms a page at a time.
   */
  suggestChatRooms = (call: ServerUnaryCall<chatChatRoomQueryServiceApi.SuggestChatRoomsRequest, chatChatRoomQueryServiceApi.SuggestChatRoomsResponse>, done: sendUnaryData<chatChatRoomQueryServiceApi.SuggestChatRoomsResponse>): void => {
    void this.workflow.suggestChatRooms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a chat room.
   */
  summarizeChatRooms = unary<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse>(
    (request) => this.workflow.summarizeChatRooms(request),
  );
}

export function implementation(handler: ChatRoomQueryHandler): chatChatRoomQueryServiceApi.ChatRoomQueryServiceServer {
  return {
    browseChatRooms: handler.browseChatRooms,
    countChatRooms: handler.countChatRooms,
    exportChatRooms: handler.exportChatRooms,
    findChatRooms: handler.findChatRooms,
    lookupChatRoom: handler.lookupChatRoom,
    peekChatRoom: handler.peekChatRoom,
    resolveChatRooms: handler.resolveChatRooms,
    suggestChatRooms: handler.suggestChatRooms,
    summarizeChatRooms: handler.summarizeChatRooms,
  };
}
