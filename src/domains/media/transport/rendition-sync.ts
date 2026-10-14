/**
 * Keeps renditions in step with the systems of record in other regions.
 */

import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { RenditionSyncWorkflow } from "../application/rendition-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RenditionSyncService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionSyncHandler {
  constructor(@inject(RenditionSyncWorkflow) private readonly workflow: RenditionSyncWorkflow) {}

  /**
   * Returns a rendition.
   */
  getRenditionSyncState = (call: ServerUnaryCall<mediaRenditionSyncServiceApi.GetRenditionSyncStateRequest, mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse>, done: sendUnaryData<mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse>): void => {
    void this.workflow.getRenditionSyncState(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists renditions a page at a time.
   */
  listRenditionConflicts = unary<mediaRenditionSyncServiceApi.ListRenditionConflictsRequest, mediaRenditionSyncServiceApi.ListRenditionConflictsResponse>(
    (request) => this.workflow.listRenditionConflicts(request),
  );

  /**
   * Pulls a rendition.
   */
  pullRenditions = unary<mediaRenditionSyncServiceApi.PullRenditionsRequest, mediaRenditionSyncServiceApi.PullRenditionsResponse>(
    (request) => this.workflow.pullRenditions(request),
  );

  /**
   * Pushs a rendition.
   */
  pushRendition = (call: ServerUnaryCall<mediaRenditionSyncServiceApi.PushRenditionRequest, mediaRenditionSyncServiceApi.PushRenditionResponse>, done: sendUnaryData<mediaRenditionSyncServiceApi.PushRenditionResponse>): void => {
    void this.workflow.pushRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reconciles a rendition.
   */
  reconcileRenditions = unary<mediaRenditionSyncServiceApi.ReconcileRenditionsRequest, mediaRenditionSyncServiceApi.ReconcileRenditionsResponse>(
    (request) => this.workflow.reconcileRenditions(request),
  );

  /**
   * Resolves a rendition.
   */
  resolveRenditionConflict = unary<mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest, mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse>(
    (request) => this.workflow.resolveRenditionConflict(request),
  );

  /**
   * Exchanges changes of renditions with a peer.
   */
  streamRenditionChanges = duplex<mediaRenditionSyncServiceApi.StreamRenditionChangesRequest, mediaRenditionSyncServiceApi.StreamRenditionChangesResponse>(
    (request) => this.workflow.streamRenditionChanges(request),
  );

  /**
   * Syncs a rendition.
   */
  syncRenditions = unary<mediaRenditionSyncServiceApi.SyncRenditionsRequest, mediaRenditionSyncServiceApi.SyncRenditionsResponse>(
    (request) => this.workflow.syncRenditions(request),
  );
}

export function implementation(handler: RenditionSyncHandler): mediaRenditionSyncServiceApi.RenditionSyncServiceServer {
  return {
    getRenditionSyncState: handler.getRenditionSyncState,
    listRenditionConflicts: handler.listRenditionConflicts,
    pullRenditions: handler.pullRenditions,
    pushRendition: handler.pushRendition,
    reconcileRenditions: handler.reconcileRenditions,
    resolveRenditionConflict: handler.resolveRenditionConflict,
    streamRenditionChanges: handler.streamRenditionChanges,
    syncRenditions: handler.syncRenditions,
  };
}
