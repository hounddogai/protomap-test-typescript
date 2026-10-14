/**
 * Builds and schedules reports about renditions.
 */

import * as mediaRenditionReportingServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { RenditionReportingWorkflow } from "./rendition-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RenditionReportingService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionReportingHandler {
  constructor(@inject(RenditionReportingWorkflow) private readonly workflow: RenditionReportingWorkflow) {}

  /**
   * Counts renditions by status.
   */
  countRenditionTotals = unary<mediaRenditionReportingServiceApi.CountRenditionTotalsRequest, mediaRenditionReportingServiceApi.CountRenditionTotalsResponse>(
    (request) => this.workflow.countRenditionTotals(request),
  );

  /**
   * Deletes a rendition.
   */
  deleteRenditionReport = (call: ServerUnaryCall<mediaRenditionReportingServiceApi.DeleteRenditionReportRequest, mediaRenditionReportingServiceApi.DeleteRenditionReportResponse>, done: sendUnaryData<mediaRenditionReportingServiceApi.DeleteRenditionReportResponse>): void => {
    void this.workflow.deleteRenditionReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a rendition.
   */
  fetchRenditionReport = unary<mediaRenditionReportingServiceApi.FetchRenditionReportRequest, mediaRenditionReportingServiceApi.FetchRenditionReportResponse>(
    (request) => this.workflow.fetchRenditionReport(request),
  );

  /**
   * Generates a rendition.
   */
  generateRenditionReport = unary<mediaRenditionReportingServiceApi.GenerateRenditionReportRequest, mediaRenditionReportingServiceApi.GenerateRenditionReportResponse>(
    (request) => this.workflow.generateRenditionReport(request),
  );

  /**
   * Lists renditions a page at a time.
   */
  listRenditionReports = (call: ServerUnaryCall<mediaRenditionReportingServiceApi.ListRenditionReportsRequest, mediaRenditionReportingServiceApi.ListRenditionReportsResponse>, done: sendUnaryData<mediaRenditionReportingServiceApi.ListRenditionReportsResponse>): void => {
    void this.workflow.listRenditionReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a rendition.
   */
  scheduleRenditionReport = unary<mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest, mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse>(
    (request) => this.workflow.scheduleRenditionReport(request),
  );

  /**
   * Shares a rendition.
   */
  shareRenditionReport = unary<mediaRenditionReportingServiceApi.ShareRenditionReportRequest, mediaRenditionReportingServiceApi.ShareRenditionReportResponse>(
    (request) => this.workflow.shareRenditionReport(request),
  );
}

export function implementation(handler: RenditionReportingHandler): mediaRenditionReportingServiceApi.RenditionReportingServiceServer {
  return {
    countRenditionTotals: handler.countRenditionTotals,
    deleteRenditionReport: handler.deleteRenditionReport,
    fetchRenditionReport: handler.fetchRenditionReport,
    generateRenditionReport: handler.generateRenditionReport,
    listRenditionReports: handler.listRenditionReports,
    scheduleRenditionReport: handler.scheduleRenditionReport,
    shareRenditionReport: handler.shareRenditionReport,
  };
}
