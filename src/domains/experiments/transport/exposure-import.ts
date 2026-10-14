/**
 * Takes exposures in bulk from partners and legacy systems.
 */

import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, unary } from "../../../platform/handlers.js";
import { ExposureImportWorkflow } from "../application/exposure-import.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExposureImportService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureImportHandler {
  constructor(@inject(ExposureImportWorkflow) private readonly workflow: ExposureImportWorkflow) {}

  /**
   * Cancels an exposure.
   */
  cancelExposureImport = (call: ServerUnaryCall<experimentsExposureImportServiceApi.CancelExposureImportRequest, experimentsExposureImportServiceApi.CancelExposureImportResponse>, done: sendUnaryData<experimentsExposureImportServiceApi.CancelExposureImportResponse>): void => {
    void this.workflow.cancelExposureImport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an exposure.
   */
  getExposureImportStatus = unary<experimentsExposureImportServiceApi.GetExposureImportStatusRequest, experimentsExposureImportServiceApi.GetExposureImportStatusResponse>(
    (request) => this.workflow.getExposureImportStatus(request),
  );

  /**
   * Takes a stream of exposures and answers once at the end.
   */
  importExposures = clientStream<experimentsExposureImportServiceApi.ImportExposuresRequest, experimentsExposureImportServiceApi.ImportExposuresResponse>(
    (request) => this.workflow.importExposures(request), () => experimentsExposureImportServiceApi.ImportExposuresResponse.fromPartial({}),
  );

  /**
   * Lists exposures a page at a time.
   */
  listExposureImports = (call: ServerUnaryCall<experimentsExposureImportServiceApi.ListExposureImportsRequest, experimentsExposureImportServiceApi.ListExposureImportsResponse>, done: sendUnaryData<experimentsExposureImportServiceApi.ListExposureImportsResponse>): void => {
    void this.workflow.listExposureImports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Maps an exposure.
   */
  mapExposureImportColumns = unary<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse>(
    (request) => this.workflow.mapExposureImportColumns(request),
  );

  /**
   * Retrys an exposure.
   */
  retryExposureImport = unary<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>(
    (request) => this.workflow.retryExposureImport(request),
  );

  /**
   * Validates an exposure.
   */
  validateExposureImport = (call: ServerUnaryCall<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse>, done: sendUnaryData<experimentsExposureImportServiceApi.ValidateExposureImportResponse>): void => {
    void this.workflow.validateExposureImport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ExposureImportHandler): experimentsExposureImportServiceApi.ExposureImportServiceServer {
  return {
    cancelExposureImport: handler.cancelExposureImport,
    getExposureImportStatus: handler.getExposureImportStatus,
    importExposures: handler.importExposures,
    listExposureImports: handler.listExposureImports,
    mapExposureImportColumns: handler.mapExposureImportColumns,
    retryExposureImport: handler.retryExposureImport,
    validateExposureImport: handler.validateExposureImport,
  };
}
