/**
 * Takes participants in bulk from partners and legacy systems.
 */

import * as messagingParticipantImportServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, unary } from "../../../platform/handlers.js";
import { ParticipantImportWorkflow } from "../application/participant-import.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ParticipantImportService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantImportHandler {
  constructor(@inject(ParticipantImportWorkflow) private readonly workflow: ParticipantImportWorkflow) {}

  /**
   * Cancels a participant.
   */
  cancelParticipantImport = (call: ServerUnaryCall<messagingParticipantImportServiceApi.CancelParticipantImportRequest, messagingParticipantImportServiceApi.CancelParticipantImportResponse>, done: sendUnaryData<messagingParticipantImportServiceApi.CancelParticipantImportResponse>): void => {
    void this.workflow.cancelParticipantImport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a participant.
   */
  getParticipantImportStatus = unary<messagingParticipantImportServiceApi.GetParticipantImportStatusRequest, messagingParticipantImportServiceApi.GetParticipantImportStatusResponse>(
    (request) => this.workflow.getParticipantImportStatus(request),
  );

  /**
   * Takes a stream of participants and answers once at the end.
   */
  importParticipants = clientStream<messagingParticipantImportServiceApi.ImportParticipantsRequest, messagingParticipantImportServiceApi.ImportParticipantsResponse>(
    (request) => this.workflow.importParticipants(request), () => messagingParticipantImportServiceApi.ImportParticipantsResponse.fromPartial({}),
  );

  /**
   * Lists participants a page at a time.
   */
  listParticipantImports = (call: ServerUnaryCall<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse>, done: sendUnaryData<messagingParticipantImportServiceApi.ListParticipantImportsResponse>): void => {
    void this.workflow.listParticipantImports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Maps a participant.
   */
  mapParticipantImportColumns = unary<messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest, messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse>(
    (request) => this.workflow.mapParticipantImportColumns(request),
  );

  /**
   * Retrys a participant.
   */
  retryParticipantImport = unary<messagingParticipantImportServiceApi.RetryParticipantImportRequest, messagingParticipantImportServiceApi.RetryParticipantImportResponse>(
    (request) => this.workflow.retryParticipantImport(request),
  );

  /**
   * Validates a participant.
   */
  validateParticipantImport = (call: ServerUnaryCall<messagingParticipantImportServiceApi.ValidateParticipantImportRequest, messagingParticipantImportServiceApi.ValidateParticipantImportResponse>, done: sendUnaryData<messagingParticipantImportServiceApi.ValidateParticipantImportResponse>): void => {
    void this.workflow.validateParticipantImport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ParticipantImportHandler): messagingParticipantImportServiceApi.ParticipantImportServiceServer {
  return {
    cancelParticipantImport: handler.cancelParticipantImport,
    getParticipantImportStatus: handler.getParticipantImportStatus,
    importParticipants: handler.importParticipants,
    listParticipantImports: handler.listParticipantImports,
    mapParticipantImportColumns: handler.mapParticipantImportColumns,
    retryParticipantImport: handler.retryParticipantImport,
    validateParticipantImport: handler.validateParticipantImport,
  };
}
