/**
 * Builds and schedules reports about media assets.
 */

import * as mediaMediaAssetReportingServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { MediaAssetReportingWorkflow } from "./media-asset-reporting.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetReportingService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetReportingHandler {
  constructor(@inject(MediaAssetReportingWorkflow) private readonly workflow: MediaAssetReportingWorkflow) {}

  /**
   * Deletes a media asset.
   */
  deleteMediaAssetReport = unary<mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse>(
    (request) => this.workflow.deleteMediaAssetReport(request),
  );

  /**
   * Returns a media asset.
   */
  fetchMediaAssetReport = (call: ServerUnaryCall<mediaMediaAssetReportingServiceApi.FetchMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.FetchMediaAssetReportResponse>, done: sendUnaryData<mediaMediaAssetReportingServiceApi.FetchMediaAssetReportResponse>): void => {
    void this.workflow.fetchMediaAssetReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Generates a media asset.
   */
  generateMediaAssetReport = unary<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse>(
    (request) => this.workflow.generateMediaAssetReport(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  listMediaAssetReports = unary<mediaMediaAssetReportingServiceApi.ListMediaAssetReportsRequest, mediaMediaAssetReportingServiceApi.ListMediaAssetReportsResponse>(
    (request) => this.workflow.listMediaAssetReports(request),
  );

  /**
   * Schedules a media asset.
   */
  scheduleMediaAssetReport = (call: ServerUnaryCall<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse>, done: sendUnaryData<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse>): void => {
    void this.workflow.scheduleMediaAssetReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a media asset.
   */
  shareMediaAssetReport = unary<mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse>(
    (request) => this.workflow.shareMediaAssetReport(request),
  );
}

export function implementation(handler: MediaAssetReportingHandler): mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceServer {
  return {
    deleteMediaAssetReport: handler.deleteMediaAssetReport,
    fetchMediaAssetReport: handler.fetchMediaAssetReport,
    generateMediaAssetReport: handler.generateMediaAssetReport,
    listMediaAssetReports: handler.listMediaAssetReports,
    scheduleMediaAssetReport: handler.scheduleMediaAssetReport,
    shareMediaAssetReport: handler.shareMediaAssetReport,
  };
}
