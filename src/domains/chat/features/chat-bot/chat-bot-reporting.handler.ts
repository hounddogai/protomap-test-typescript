/**
 * Builds and schedules reports about chat bots.
 */

import * as chatChatBotReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ChatBotReportingWorkflow } from "./chat-bot-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChatBotReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotReportingHandler {
  constructor(@inject(ChatBotReportingWorkflow) private readonly workflow: ChatBotReportingWorkflow) {}

  /**
   * Counts chat bots by status.
   */
  countChatBotTotals = unary<chatChatBotReportingServiceApi.CountChatBotTotalsRequest, chatChatBotReportingServiceApi.CountChatBotTotalsResponse>(
    (request) => this.workflow.countChatBotTotals(request),
  );

  /**
   * Deletes a chat bot.
   */
  deleteChatBotReport = (call: ServerUnaryCall<chatChatBotReportingServiceApi.DeleteChatBotReportRequest, chatChatBotReportingServiceApi.DeleteChatBotReportResponse>, done: sendUnaryData<chatChatBotReportingServiceApi.DeleteChatBotReportResponse>): void => {
    void this.workflow.deleteChatBotReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a chat bot.
   */
  fetchChatBotReport = unary<chatChatBotReportingServiceApi.FetchChatBotReportRequest, chatChatBotReportingServiceApi.FetchChatBotReportResponse>(
    (request) => this.workflow.fetchChatBotReport(request),
  );

  /**
   * Generates a chat bot.
   */
  generateChatBotReport = unary<chatChatBotReportingServiceApi.GenerateChatBotReportRequest, chatChatBotReportingServiceApi.GenerateChatBotReportResponse>(
    (request) => this.workflow.generateChatBotReport(request),
  );

  /**
   * Lists chat bots a page at a time.
   */
  listChatBotReports = (call: ServerUnaryCall<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse>, done: sendUnaryData<chatChatBotReportingServiceApi.ListChatBotReportsResponse>): void => {
    void this.workflow.listChatBotReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a chat bot.
   */
  scheduleChatBotReport = unary<chatChatBotReportingServiceApi.ScheduleChatBotReportRequest, chatChatBotReportingServiceApi.ScheduleChatBotReportResponse>(
    (request) => this.workflow.scheduleChatBotReport(request),
  );

  /**
   * Shares a chat bot.
   */
  shareChatBotReport = unary<chatChatBotReportingServiceApi.ShareChatBotReportRequest, chatChatBotReportingServiceApi.ShareChatBotReportResponse>(
    (request) => this.workflow.shareChatBotReport(request),
  );

  /**
   * Streams the changes of chat bots as they happen.
   */
  streamChatBotMetrics = serverStream<chatChatBotReportingServiceApi.StreamChatBotMetricsRequest, chatChatBotReportingServiceApi.StreamChatBotMetricsResponse>(
    (request) => this.workflow.streamChatBotMetrics(request),
  );
}

export function implementation(handler: ChatBotReportingHandler): chatChatBotReportingServiceApi.ChatBotReportingServiceServer {
  return {
    countChatBotTotals: handler.countChatBotTotals,
    deleteChatBotReport: handler.deleteChatBotReport,
    fetchChatBotReport: handler.fetchChatBotReport,
    generateChatBotReport: handler.generateChatBotReport,
    listChatBotReports: handler.listChatBotReports,
    scheduleChatBotReport: handler.scheduleChatBotReport,
    shareChatBotReport: handler.shareChatBotReport,
    streamChatBotMetrics: handler.streamChatBotMetrics,
  };
}
