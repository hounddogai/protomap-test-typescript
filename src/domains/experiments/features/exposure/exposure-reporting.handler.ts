/**
 * Builds and schedules reports about exposures.
 */

import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ExposureReportingWorkflow } from "./exposure-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExposureReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureReportingHandler {
  constructor(@inject(ExposureReportingWorkflow) private readonly workflow: ExposureReportingWorkflow) {}

  /**
   * Counts exposures by status.
   */
  countExposureTotals = unary<experimentsExposureReportingServiceApi.CountExposureTotalsRequest, experimentsExposureReportingServiceApi.CountExposureTotalsResponse>(
    (request) => this.workflow.countExposureTotals(request),
  );

  /**
   * Returns an exposure.
   */
  fetchExposureReport = (call: ServerUnaryCall<experimentsExposureReportingServiceApi.FetchExposureReportRequest, experimentsExposureReportingServiceApi.FetchExposureReportResponse>, done: sendUnaryData<experimentsExposureReportingServiceApi.FetchExposureReportResponse>): void => {
    void this.workflow.fetchExposureReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Generates an exposure.
   */
  generateExposureReport = unary<experimentsExposureReportingServiceApi.GenerateExposureReportRequest, experimentsExposureReportingServiceApi.GenerateExposureReportResponse>(
    (request) => this.workflow.generateExposureReport(request),
  );

  /**
   * Lists exposures a page at a time.
   */
  listExposureReports = unary<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse>(
    (request) => this.workflow.listExposureReports(request),
  );

  /**
   * Schedules an exposure.
   */
  scheduleExposureReport = (call: ServerUnaryCall<experimentsExposureReportingServiceApi.ScheduleExposureReportRequest, experimentsExposureReportingServiceApi.ScheduleExposureReportResponse>, done: sendUnaryData<experimentsExposureReportingServiceApi.ScheduleExposureReportResponse>): void => {
    void this.workflow.scheduleExposureReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares an exposure.
   */
  shareExposureReport = unary<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>(
    (request) => this.workflow.shareExposureReport(request),
  );

  /**
   * Streams the changes of exposures as they happen.
   */
  streamExposureMetrics = serverStream<experimentsExposureReportingServiceApi.StreamExposureMetricsRequest, experimentsExposureReportingServiceApi.StreamExposureMetricsResponse>(
    (request) => this.workflow.streamExposureMetrics(request),
  );
}

export function implementation(handler: ExposureReportingHandler): experimentsExposureReportingServiceApi.ExposureReportingServiceServer {
  return {
    countExposureTotals: handler.countExposureTotals,
    fetchExposureReport: handler.fetchExposureReport,
    generateExposureReport: handler.generateExposureReport,
    listExposureReports: handler.listExposureReports,
    scheduleExposureReport: handler.scheduleExposureReport,
    shareExposureReport: handler.shareExposureReport,
    streamExposureMetrics: handler.streamExposureMetrics,
  };
}
