/**
 * Computes the figures of a chat room, such as totals, taxes, and estimates.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChatRoomCalculationWorkflow } from "../application/chat-room-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatRoomCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomCalculationHandler {
  constructor(@inject(ChatRoomCalculationWorkflow) private readonly workflow: ChatRoomCalculationWorkflow) {}

  /**
   * Calculates a chat room.
   */
  calculateChatRoom = (call: ServerUnaryCall<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse>, done: sendUnaryData<chatChatRoomCalculationServiceApi.CalculateChatRoomResponse>): void => {
    void this.workflow.calculateChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a chat room.
   */
  compareChatRoomOptions = unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(
    (request) => this.workflow.compareChatRoomOptions(request),
  );

  /**
   * Estimates a chat room.
   */
  estimateChatRoom = unary<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse>(
    (request) => this.workflow.estimateChatRoom(request),
  );

  /**
   * Explains a chat room.
   */
  explainChatRoomCalculation = (call: ServerUnaryCall<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse>, done: sendUnaryData<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse>): void => {
    void this.workflow.explainChatRoomCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a chat room.
   */
  quoteChatRoom = unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(
    (request) => this.workflow.quoteChatRoom(request),
  );

  /**
   * Recalculates a chat room.
   */
  recalculateChatRooms = unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse>(
    (request) => this.workflow.recalculateChatRooms(request),
  );

  /**
   * Simulates a chat room.
   */
  simulateChatRoom = (call: ServerUnaryCall<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>, done: sendUnaryData<chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>): void => {
    void this.workflow.simulateChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ChatRoomCalculationHandler): chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceServer {
  return {
    calculateChatRoom: handler.calculateChatRoom,
    compareChatRoomOptions: handler.compareChatRoomOptions,
    estimateChatRoom: handler.estimateChatRoom,
    explainChatRoomCalculation: handler.explainChatRoomCalculation,
    quoteChatRoom: handler.quoteChatRoom,
    recalculateChatRooms: handler.recalculateChatRooms,
    simulateChatRoom: handler.simulateChatRoom,
  };
}
