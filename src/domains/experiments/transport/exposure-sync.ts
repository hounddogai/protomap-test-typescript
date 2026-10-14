/**
 * Keeps exposures in step with the systems of record in other regions.
 */

import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ExposureSyncWorkflow } from "../application/exposure-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExposureSyncService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureSyncHandler {
  constructor(@inject(ExposureSyncWorkflow) private readonly workflow: ExposureSyncWorkflow) {}

  /**
   * Returns an exposure.
   */
  getExposureSyncState = (call: ServerUnaryCall<experimentsExposureSyncServiceApi.GetExposureSyncStateRequest, experimentsExposureSyncServiceApi.GetExposureSyncStateResponse>, done: sendUnaryData<experimentsExposureSyncServiceApi.GetExposureSyncStateResponse>): void => {
    void this.workflow.getExposureSyncState(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls an exposure.
   */
  pullExposures = unary<experimentsExposureSyncServiceApi.PullExposuresRequest, experimentsExposureSyncServiceApi.PullExposuresResponse>(
    (request) => this.workflow.pullExposures(request),
  );

  /**
   * Pushs an exposure.
   */
  pushExposure = unary<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(
    (request) => this.workflow.pushExposure(request),
  );

  /**
   * Reconciles an exposure.
   */
  reconcileExposures = (call: ServerUnaryCall<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>, done: sendUnaryData<experimentsExposureSyncServiceApi.ReconcileExposuresResponse>): void => {
    void this.workflow.reconcileExposures(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves an exposure.
   */
  resolveExposureConflict = unary<experimentsExposureSyncServiceApi.ResolveExposureConflictRequest, experimentsExposureSyncServiceApi.ResolveExposureConflictResponse>(
    (request) => this.workflow.resolveExposureConflict(request),
  );

  /**
   * Syncs an exposure.
   */
  syncExposures = unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse>(
    (request) => this.workflow.syncExposures(request),
  );
}

export function implementation(handler: ExposureSyncHandler): experimentsExposureSyncServiceApi.ExposureSyncServiceServer {
  return {
    getExposureSyncState: handler.getExposureSyncState,
    pullExposures: handler.pullExposures,
    pushExposure: handler.pushExposure,
    reconcileExposures: handler.reconcileExposures,
    resolveExposureConflict: handler.resolveExposureConflict,
    syncExposures: handler.syncExposures,
  };
}
