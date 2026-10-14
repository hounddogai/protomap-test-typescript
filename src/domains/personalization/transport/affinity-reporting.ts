/**
 * Builds and schedules reports about affinities.
 */

import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AffinityReportingWorkflow } from "../application/affinity-reporting.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityReportingService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityReportingHandler {
  constructor(@inject(AffinityReportingWorkflow) private readonly workflow: AffinityReportingWorkflow) {}

  /**
   * Counts affinities by status.
   */
  countAffinityTotals = (call: ServerUnaryCall<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>, done: sendUnaryData<personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>): void => {
    void this.workflow.countAffinityTotals(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes an affinity.
   */
  deleteAffinityReport = unary<personalizationAffinityReportingServiceApi.DeleteAffinityReportRequest, personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse>(
    (request) => this.workflow.deleteAffinityReport(request),
  );

  /**
   * Returns an affinity.
   */
  fetchAffinityReport = unary<personalizationAffinityReportingServiceApi.FetchAffinityReportRequest, personalizationAffinityReportingServiceApi.FetchAffinityReportResponse>(
    (request) => this.workflow.fetchAffinityReport(request),
  );

  /**
   * Generates an affinity.
   */
  generateAffinityReport = (call: ServerUnaryCall<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>, done: sendUnaryData<personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>): void => {
    void this.workflow.generateAffinityReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists affinities a page at a time.
   */
  listAffinityReports = unary<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse>(
    (request) => this.workflow.listAffinityReports(request),
  );

  /**
   * Schedules an affinity.
   */
  scheduleAffinityReport = unary<personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest, personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse>(
    (request) => this.workflow.scheduleAffinityReport(request),
  );

  /**
   * Shares an affinity.
   */
  shareAffinityReport = (call: ServerUnaryCall<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>, done: sendUnaryData<personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>): void => {
    void this.workflow.shareAffinityReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AffinityReportingHandler): personalizationAffinityReportingServiceApi.AffinityReportingServiceServer {
  return {
    countAffinityTotals: handler.countAffinityTotals,
    deleteAffinityReport: handler.deleteAffinityReport,
    fetchAffinityReport: handler.fetchAffinityReport,
    generateAffinityReport: handler.generateAffinityReport,
    listAffinityReports: handler.listAffinityReports,
    scheduleAffinityReport: handler.scheduleAffinityReport,
    shareAffinityReport: handler.shareAffinityReport,
  };
}
