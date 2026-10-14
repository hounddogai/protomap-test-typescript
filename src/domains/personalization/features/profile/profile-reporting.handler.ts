/**
 * Builds and schedules reports about profiles.
 */

import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ProfileReportingWorkflow } from "./profile-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ProfileReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileReportingHandler {
  constructor(@inject(ProfileReportingWorkflow) private readonly workflow: ProfileReportingWorkflow) {}

  /**
   * Counts profiles by status.
   */
  countProfileTotals = unary<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse>(
    (request) => this.workflow.countProfileTotals(request),
  );

  /**
   * Deletes a profile.
   */
  deleteProfileReport = (call: ServerUnaryCall<personalizationProfileReportingServiceApi.DeleteProfileReportRequest, personalizationProfileReportingServiceApi.DeleteProfileReportResponse>, done: sendUnaryData<personalizationProfileReportingServiceApi.DeleteProfileReportResponse>): void => {
    void this.workflow.deleteProfileReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a profile.
   */
  fetchProfileReport = unary<personalizationProfileReportingServiceApi.FetchProfileReportRequest, personalizationProfileReportingServiceApi.FetchProfileReportResponse>(
    (request) => this.workflow.fetchProfileReport(request),
  );

  /**
   * Generates a profile.
   */
  generateProfileReport = unary<personalizationProfileReportingServiceApi.GenerateProfileReportRequest, personalizationProfileReportingServiceApi.GenerateProfileReportResponse>(
    (request) => this.workflow.generateProfileReport(request),
  );

  /**
   * Lists profiles a page at a time.
   */
  listProfileReports = (call: ServerUnaryCall<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse>, done: sendUnaryData<personalizationProfileReportingServiceApi.ListProfileReportsResponse>): void => {
    void this.workflow.listProfileReports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a profile.
   */
  shareProfileReport = unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(
    (request) => this.workflow.shareProfileReport(request),
  );
}

export function implementation(handler: ProfileReportingHandler): personalizationProfileReportingServiceApi.ProfileReportingServiceServer {
  return {
    countProfileTotals: handler.countProfileTotals,
    deleteProfileReport: handler.deleteProfileReport,
    fetchProfileReport: handler.fetchProfileReport,
    generateProfileReport: handler.generateProfileReport,
    listProfileReports: handler.listProfileReports,
    shareProfileReport: handler.shareProfileReport,
  };
}
