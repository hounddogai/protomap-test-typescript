/**
 * Builds and schedules reports about handoffs.
 */

import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { HandoffReportingWorkflow } from "../application/handoff-reporting.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for HandoffReportingService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffReportingHandler {
  constructor(@inject(HandoffReportingWorkflow) private readonly workflow: HandoffReportingWorkflow) {}

  /**
   * Counts handoffs by status.
   */
  countHandoffTotals = (call: ServerUnaryCall<chatHandoffReportingServiceApi.CountHandoffTotalsRequest, chatHandoffReportingServiceApi.CountHandoffTotalsResponse>, done: sendUnaryData<chatHandoffReportingServiceApi.CountHandoffTotalsResponse>): void => {
    void this.workflow.countHandoffTotals(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a handoff.
   */
  fetchHandoffReport = unary<chatHandoffReportingServiceApi.FetchHandoffReportRequest, chatHandoffReportingServiceApi.FetchHandoffReportResponse>(
    (request) => this.workflow.fetchHandoffReport(request),
  );

  /**
   * Generates a handoff.
   */
  generateHandoffReport = unary<chatHandoffReportingServiceApi.GenerateHandoffReportRequest, chatHandoffReportingServiceApi.GenerateHandoffReportResponse>(
    (request) => this.workflow.generateHandoffReport(request),
  );

  /**
   * Lists handoffs a page at a time.
   */
  listHandoffReports = (call: ServerUnaryCall<chatHandoffReportingServiceApi.ListHandoffReportsRequest, chatHandoffReportingServiceApi.ListHandoffReportsResponse>, done: sendUnaryData<chatHandoffReportingServiceApi.ListHandoffReportsResponse>): void => {
    void this.workflow.listHandoffReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a handoff.
   */
  scheduleHandoffReport = unary<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse>(
    (request) => this.workflow.scheduleHandoffReport(request),
  );

  /**
   * Shares a handoff.
   */
  shareHandoffReport = unary<chatHandoffReportingServiceApi.ShareHandoffReportRequest, chatHandoffReportingServiceApi.ShareHandoffReportResponse>(
    (request) => this.workflow.shareHandoffReport(request),
  );

  /**
   * Streams the changes of handoffs as they happen.
   */
  streamHandoffMetrics = serverStream<chatHandoffReportingServiceApi.StreamHandoffMetricsRequest, chatHandoffReportingServiceApi.StreamHandoffMetricsResponse>(
    (request) => this.workflow.streamHandoffMetrics(request),
  );
}

export function implementation(handler: HandoffReportingHandler): chatHandoffReportingServiceApi.HandoffReportingServiceServer {
  return {
    countHandoffTotals: handler.countHandoffTotals,
    fetchHandoffReport: handler.fetchHandoffReport,
    generateHandoffReport: handler.generateHandoffReport,
    listHandoffReports: handler.listHandoffReports,
    scheduleHandoffReport: handler.scheduleHandoffReport,
    shareHandoffReport: handler.shareHandoffReport,
    streamHandoffMetrics: handler.streamHandoffMetrics,
  };
}
