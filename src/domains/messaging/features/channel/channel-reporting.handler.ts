/**
 * Builds and schedules reports about channels.
 */

import * as messagingChannelReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChannelReportingWorkflow } from "./channel-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChannelReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelReportingHandler {
  constructor(@inject(ChannelReportingWorkflow) private readonly workflow: ChannelReportingWorkflow) {}

  /**
   * Counts channels by status.
   */
  countChannelTotals = unary<messagingChannelReportingServiceApi.CountChannelTotalsRequest, messagingChannelReportingServiceApi.CountChannelTotalsResponse>(
    (request) => this.workflow.countChannelTotals(request),
  );

  /**
   * Deletes a channel.
   */
  deleteChannelReport = (call: ServerUnaryCall<messagingChannelReportingServiceApi.DeleteChannelReportRequest, messagingChannelReportingServiceApi.DeleteChannelReportResponse>, done: sendUnaryData<messagingChannelReportingServiceApi.DeleteChannelReportResponse>): void => {
    void this.workflow.deleteChannelReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a channel.
   */
  fetchChannelReport = unary<messagingChannelReportingServiceApi.FetchChannelReportRequest, messagingChannelReportingServiceApi.FetchChannelReportResponse>(
    (request) => this.workflow.fetchChannelReport(request),
  );

  /**
   * Generates a channel.
   */
  generateChannelReport = unary<messagingChannelReportingServiceApi.GenerateChannelReportRequest, messagingChannelReportingServiceApi.GenerateChannelReportResponse>(
    (request) => this.workflow.generateChannelReport(request),
  );

  /**
   * Lists channels a page at a time.
   */
  listChannelReports = (call: ServerUnaryCall<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse>, done: sendUnaryData<messagingChannelReportingServiceApi.ListChannelReportsResponse>): void => {
    void this.workflow.listChannelReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a channel.
   */
  scheduleChannelReport = unary<messagingChannelReportingServiceApi.ScheduleChannelReportRequest, messagingChannelReportingServiceApi.ScheduleChannelReportResponse>(
    (request) => this.workflow.scheduleChannelReport(request),
  );

  /**
   * Shares a channel.
   */
  shareChannelReport = unary<messagingChannelReportingServiceApi.ShareChannelReportRequest, messagingChannelReportingServiceApi.ShareChannelReportResponse>(
    (request) => this.workflow.shareChannelReport(request),
  );
}

export function implementation(handler: ChannelReportingHandler): messagingChannelReportingServiceApi.ChannelReportingServiceServer {
  return {
    countChannelTotals: handler.countChannelTotals,
    deleteChannelReport: handler.deleteChannelReport,
    fetchChannelReport: handler.fetchChannelReport,
    generateChannelReport: handler.generateChannelReport,
    listChannelReports: handler.listChannelReports,
    scheduleChannelReport: handler.scheduleChannelReport,
    shareChannelReport: handler.shareChannelReport,
  };
}
