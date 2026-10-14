/**
 * Builds and schedules reports about participants.
 */

import * as messagingParticipantReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ParticipantReportingWorkflow } from "./participant-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ParticipantReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantReportingHandler {
  constructor(@inject(ParticipantReportingWorkflow) private readonly workflow: ParticipantReportingWorkflow) {}

  /**
   * Counts participants by status.
   */
  countParticipantTotals = unary<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse>(
    (request) => this.workflow.countParticipantTotals(request),
  );

  /**
   * Deletes a participant.
   */
  deleteParticipantReport = (call: ServerUnaryCall<messagingParticipantReportingServiceApi.DeleteParticipantReportRequest, messagingParticipantReportingServiceApi.DeleteParticipantReportResponse>, done: sendUnaryData<messagingParticipantReportingServiceApi.DeleteParticipantReportResponse>): void => {
    void this.workflow.deleteParticipantReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a participant.
   */
  fetchParticipantReport = unary<messagingParticipantReportingServiceApi.FetchParticipantReportRequest, messagingParticipantReportingServiceApi.FetchParticipantReportResponse>(
    (request) => this.workflow.fetchParticipantReport(request),
  );

  /**
   * Generates a participant.
   */
  generateParticipantReport = unary<messagingParticipantReportingServiceApi.GenerateParticipantReportRequest, messagingParticipantReportingServiceApi.GenerateParticipantReportResponse>(
    (request) => this.workflow.generateParticipantReport(request),
  );

  /**
   * Lists participants a page at a time.
   */
  listParticipantReports = (call: ServerUnaryCall<messagingParticipantReportingServiceApi.ListParticipantReportsRequest, messagingParticipantReportingServiceApi.ListParticipantReportsResponse>, done: sendUnaryData<messagingParticipantReportingServiceApi.ListParticipantReportsResponse>): void => {
    void this.workflow.listParticipantReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a participant.
   */
  scheduleParticipantReport = unary<messagingParticipantReportingServiceApi.ScheduleParticipantReportRequest, messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse>(
    (request) => this.workflow.scheduleParticipantReport(request),
  );

  /**
   * Shares a participant.
   */
  shareParticipantReport = unary<messagingParticipantReportingServiceApi.ShareParticipantReportRequest, messagingParticipantReportingServiceApi.ShareParticipantReportResponse>(
    (request) => this.workflow.shareParticipantReport(request),
  );

  /**
   * Streams the changes of participants as they happen.
   */
  streamParticipantMetrics = serverStream<messagingParticipantReportingServiceApi.StreamParticipantMetricsRequest, messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse>(
    (request) => this.workflow.streamParticipantMetrics(request),
  );
}

export function implementation(handler: ParticipantReportingHandler): messagingParticipantReportingServiceApi.ParticipantReportingServiceServer {
  return {
    countParticipantTotals: handler.countParticipantTotals,
    deleteParticipantReport: handler.deleteParticipantReport,
    fetchParticipantReport: handler.fetchParticipantReport,
    generateParticipantReport: handler.generateParticipantReport,
    listParticipantReports: handler.listParticipantReports,
    scheduleParticipantReport: handler.scheduleParticipantReport,
    shareParticipantReport: handler.shareParticipantReport,
    streamParticipantMetrics: handler.streamParticipantMetrics,
  };
}
