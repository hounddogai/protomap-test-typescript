/**
 * Takes transcode jobs in bulk from partners and legacy systems.
 */

import * as mediaTranscodeJobImportServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, unary } from "../../../../platform/handlers.js";
import { TranscodeJobImportWorkflow } from "./transcode-job-import.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranscodeJobImportService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobImportHandler {
  constructor(@inject(TranscodeJobImportWorkflow) private readonly workflow: TranscodeJobImportWorkflow) {}

  /**
   * Cancels a transcode job.
   */
  cancelTranscodeJobImport = unary<mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportResponse>(
    (request) => this.workflow.cancelTranscodeJobImport(request),
  );

  /**
   * Returns a transcode job.
   */
  getTranscodeJobImportStatus = (call: ServerUnaryCall<mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusRequest, mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse>, done: sendUnaryData<mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse>): void => {
    void this.workflow.getTranscodeJobImportStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Takes a stream of transcode jobs and answers once at the end.
   */
  importTranscodeJobs = clientStream<mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest, mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse>(
    (request) => this.workflow.importTranscodeJobs(request), () => mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse.fromPartial({}),
  );

  /**
   * Lists transcode jobs a page at a time.
   */
  listTranscodeJobImports = unary<mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsRequest, mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsResponse>(
    (request) => this.workflow.listTranscodeJobImports(request),
  );

  /**
   * Maps a transcode job.
   */
  mapTranscodeJobImportColumns = (call: ServerUnaryCall<mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsRequest, mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse>, done: sendUnaryData<mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse>): void => {
    void this.workflow.mapTranscodeJobImportColumns(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a transcode job.
   */
  retryTranscodeJobImport = unary<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse>(
    (request) => this.workflow.retryTranscodeJobImport(request),
  );

  /**
   * Validates a transcode job.
   */
  validateTranscodeJobImport = unary<mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse>(
    (request) => this.workflow.validateTranscodeJobImport(request),
  );
}

export function implementation(handler: TranscodeJobImportHandler): mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceServer {
  return {
    cancelTranscodeJobImport: handler.cancelTranscodeJobImport,
    getTranscodeJobImportStatus: handler.getTranscodeJobImportStatus,
    importTranscodeJobs: handler.importTranscodeJobs,
    listTranscodeJobImports: handler.listTranscodeJobImports,
    mapTranscodeJobImportColumns: handler.mapTranscodeJobImportColumns,
    retryTranscodeJobImport: handler.retryTranscodeJobImport,
    validateTranscodeJobImport: handler.validateTranscodeJobImport,
  };
}
