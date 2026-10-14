/**
 * Manages chat rooms: creates, reads, changes, and lists them.
 */

import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, unary } from "../../../platform/handlers.js";
import { ChatRoomWorkflow } from "../application/chat-room.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatRoomService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomHandler {
  constructor(@inject(ChatRoomWorkflow) private readonly workflow: ChatRoomWorkflow) {}

  /**
   * Takes a stream of chat rooms and answers once at the end.
   */
  batchCreateChatRooms = clientStream<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
    (request) => this.workflow.batchCreateChatRooms(request), () => chatChatRoomServiceApi.BatchCreateChatRoomsResponse.fromPartial({}),
  );

  /**
   * Returns several chat rooms at once.
   */
  batchGetChatRooms = unary<chatChatRoomServiceApi.BatchGetChatRoomsRequest, chatChatRoomServiceApi.BatchGetChatRoomsResponse>(
    (request) => this.workflow.batchGetChatRooms(request),
  );

  /**
   * Creates a chat room.
   */
  cloneChatRoom = unary<chatChatRoomServiceApi.CloneChatRoomRequest, chatChatRoomServiceApi.CloneChatRoomResponse>(
    (request) => this.workflow.cloneChatRoom(request),
  );

  /**
   * Creates a chat room.
   */
  createChatRoom = (call: ServerUnaryCall<chatChatRoomServiceApi.CreateChatRoomRequest, chatChatRoomServiceApi.CreateChatRoomResponse>, done: sendUnaryData<chatChatRoomServiceApi.CreateChatRoomResponse>): void => {
    void this.workflow.createChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a chat room.
   */
  deleteChatRoom = unary<chatChatRoomServiceApi.DeleteChatRoomRequest, chatChatRoomServiceApi.DeleteChatRoomResponse>(
    (request) => this.workflow.deleteChatRoom(request),
  );

  /**
   * Returns a chat room.
   */
  getChatRoom = unary<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse>(
    (request) => this.workflow.getChatRoom(request),
  );

  /**
   * Lists chat rooms a page at a time.
   */
  listChatRooms = (call: ServerUnaryCall<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse>, done: sendUnaryData<chatChatRoomServiceApi.ListChatRoomsResponse>): void => {
    void this.workflow.listChatRooms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists chat rooms a page at a time.
   */
  searchChatRooms = unary<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse>(
    (request) => this.workflow.searchChatRooms(request),
  );

  /**
   * Changes a chat room.
   */
  updateChatRoom = unary<chatChatRoomServiceApi.UpdateChatRoomRequest, chatChatRoomServiceApi.UpdateChatRoomResponse>(
    (request) => this.workflow.updateChatRoom(request),
  );
}

export function implementation(handler: ChatRoomHandler): chatChatRoomServiceApi.ChatRoomServiceServer {
  return {
    batchCreateChatRooms: handler.batchCreateChatRooms,
    batchGetChatRooms: handler.batchGetChatRooms,
    cloneChatRoom: handler.cloneChatRoom,
    createChatRoom: handler.createChatRoom,
    deleteChatRoom: handler.deleteChatRoom,
    getChatRoom: handler.getChatRoom,
    listChatRooms: handler.listChatRooms,
    searchChatRooms: handler.searchChatRooms,
    updateChatRoom: handler.updateChatRoom,
  };
}
