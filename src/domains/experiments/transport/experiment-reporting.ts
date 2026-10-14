/**
 * Builds and schedules reports about experiments.
 */

import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { ExperimentReportingWorkflow } from "../application/experiment-reporting.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentReportingHandler {
  constructor(@inject(ExperimentReportingWorkflow) private readonly workflow: ExperimentReportingWorkflow) {}

  /**
   * Counts experiments by status.
   */
  countExperimentTotals = (call: ServerUnaryCall<experimentsExperimentReportingServiceApi.CountExperimentTotalsRequest, experimentsExperimentReportingServiceApi.CountExperimentTotalsResponse>, done: sendUnaryData<experimentsExperimentReportingServiceApi.CountExperimentTotalsResponse>): void => {
    void this.workflow.countExperimentTotals(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes an experiment.
   */
  deleteExperimentReport = unary<experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest, experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse>(
    (request) => this.workflow.deleteExperimentReport(request),
  );

  /**
   * Returns an experiment.
   */
  fetchExperimentReport = unary<experimentsExperimentReportingServiceApi.FetchExperimentReportRequest, experimentsExperimentReportingServiceApi.FetchExperimentReportResponse>(
    (request) => this.workflow.fetchExperimentReport(request),
  );

  /**
   * Generates an experiment.
   */
  generateExperimentReport = (call: ServerUnaryCall<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse>, done: sendUnaryData<experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse>): void => {
    void this.workflow.generateExperimentReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists experiments a page at a time.
   */
  listExperimentReports = unary<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse>(
    (request) => this.workflow.listExperimentReports(request),
  );

  /**
   * Schedules an experiment.
   */
  scheduleExperimentReport = unary<experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest, experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse>(
    (request) => this.workflow.scheduleExperimentReport(request),
  );

  /**
   * Shares an experiment.
   */
  shareExperimentReport = (call: ServerUnaryCall<experimentsExperimentReportingServiceApi.ShareExperimentReportRequest, experimentsExperimentReportingServiceApi.ShareExperimentReportResponse>, done: sendUnaryData<experimentsExperimentReportingServiceApi.ShareExperimentReportResponse>): void => {
    void this.workflow.shareExperimentReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of experiments as they happen.
   */
  streamExperimentMetrics = serverStream<experimentsExperimentReportingServiceApi.StreamExperimentMetricsRequest, experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse>(
    (request) => this.workflow.streamExperimentMetrics(request),
  );
}

export function implementation(handler: ExperimentReportingHandler): experimentsExperimentReportingServiceApi.ExperimentReportingServiceServer {
  return {
    countExperimentTotals: handler.countExperimentTotals,
    deleteExperimentReport: handler.deleteExperimentReport,
    fetchExperimentReport: handler.fetchExperimentReport,
    generateExperimentReport: handler.generateExperimentReport,
    listExperimentReports: handler.listExperimentReports,
    scheduleExperimentReport: handler.scheduleExperimentReport,
    shareExperimentReport: handler.shareExperimentReport,
    streamExperimentMetrics: handler.streamExperimentMetrics,
  };
}
