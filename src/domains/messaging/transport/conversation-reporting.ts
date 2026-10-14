/**
 * Builds and schedules reports about conversations.
 */

import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { ConversationReportingWorkflow } from "../application/conversation-reporting.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationReportingHandler {
  constructor(@inject(ConversationReportingWorkflow) private readonly workflow: ConversationReportingWorkflow) {}

  /**
   * Counts conversations by status.
   */
  countConversationTotals = (call: ServerUnaryCall<messagingConversationReportingServiceApi.CountConversationTotalsRequest, messagingConversationReportingServiceApi.CountConversationTotalsResponse>, done: sendUnaryData<messagingConversationReportingServiceApi.CountConversationTotalsResponse>): void => {
    void this.workflow.countConversationTotals(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a conversation.
   */
  deleteConversationReport = unary<messagingConversationReportingServiceApi.DeleteConversationReportRequest, messagingConversationReportingServiceApi.DeleteConversationReportResponse>(
    (request) => this.workflow.deleteConversationReport(request),
  );

  /**
   * Returns a conversation.
   */
  fetchConversationReport = unary<messagingConversationReportingServiceApi.FetchConversationReportRequest, messagingConversationReportingServiceApi.FetchConversationReportResponse>(
    (request) => this.workflow.fetchConversationReport(request),
  );

  /**
   * Generates a conversation.
   */
  generateConversationReport = (call: ServerUnaryCall<messagingConversationReportingServiceApi.GenerateConversationReportRequest, messagingConversationReportingServiceApi.GenerateConversationReportResponse>, done: sendUnaryData<messagingConversationReportingServiceApi.GenerateConversationReportResponse>): void => {
    void this.workflow.generateConversationReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a conversation.
   */
  scheduleConversationReport = unary<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse>(
    (request) => this.workflow.scheduleConversationReport(request),
  );

  /**
   * Shares a conversation.
   */
  shareConversationReport = unary<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse>(
    (request) => this.workflow.shareConversationReport(request),
  );

  /**
   * Streams the changes of conversations as they happen.
   */
  streamConversationMetrics = serverStream<messagingConversationReportingServiceApi.StreamConversationMetricsRequest, messagingConversationReportingServiceApi.StreamConversationMetricsResponse>(
    (request) => this.workflow.streamConversationMetrics(request),
  );
}

export function implementation(handler: ConversationReportingHandler): messagingConversationReportingServiceApi.ConversationReportingServiceServer {
  return {
    countConversationTotals: handler.countConversationTotals,
    deleteConversationReport: handler.deleteConversationReport,
    fetchConversationReport: handler.fetchConversationReport,
    generateConversationReport: handler.generateConversationReport,
    scheduleConversationReport: handler.scheduleConversationReport,
    shareConversationReport: handler.shareConversationReport,
    streamConversationMetrics: handler.streamConversationMetrics,
  };
}
