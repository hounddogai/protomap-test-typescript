/**
 * Keeps variants in step with the systems of record in other regions.
 */

import * as experimentsVariantSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { duplex, unary } from "../../../../platform/handlers.js";
import { VariantSyncWorkflow } from "./variant-sync.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for VariantSyncService; workflows own validation and database transactions.
 */
@injectable()
export class VariantSyncHandler {
  constructor(@inject(VariantSyncWorkflow) private readonly workflow: VariantSyncWorkflow) {}

  /**
   * Returns a variant.
   */
  getVariantSyncState = unary<experimentsVariantSyncServiceApi.GetVariantSyncStateRequest, experimentsVariantSyncServiceApi.GetVariantSyncStateResponse>(
    (request) => this.workflow.getVariantSyncState(request),
  );

  /**
   * Lists variants a page at a time.
   */
  listVariantConflicts = (call: ServerUnaryCall<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse>, done: sendUnaryData<experimentsVariantSyncServiceApi.ListVariantConflictsResponse>): void => {
    void this.workflow.listVariantConflicts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls a variant.
   */
  pullVariants = unary<experimentsVariantSyncServiceApi.PullVariantsRequest, experimentsVariantSyncServiceApi.PullVariantsResponse>(
    (request) => this.workflow.pullVariants(request),
  );

  /**
   * Pushs a variant.
   */
  pushVariant = unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse>(
    (request) => this.workflow.pushVariant(request),
  );

  /**
   * Reconciles a variant.
   */
  reconcileVariants = (call: ServerUnaryCall<experimentsVariantSyncServiceApi.ReconcileVariantsRequest, experimentsVariantSyncServiceApi.ReconcileVariantsResponse>, done: sendUnaryData<experimentsVariantSyncServiceApi.ReconcileVariantsResponse>): void => {
    void this.workflow.reconcileVariants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves a variant.
   */
  resolveVariantConflict = unary<experimentsVariantSyncServiceApi.ResolveVariantConflictRequest, experimentsVariantSyncServiceApi.ResolveVariantConflictResponse>(
    (request) => this.workflow.resolveVariantConflict(request),
  );

  /**
   * Exchanges changes of variants with a peer.
   */
  streamVariantChanges = duplex<experimentsVariantSyncServiceApi.StreamVariantChangesRequest, experimentsVariantSyncServiceApi.StreamVariantChangesResponse>(
    (request) => this.workflow.streamVariantChanges(request),
  );

  /**
   * Syncs a variant.
   */
  syncVariants = (call: ServerUnaryCall<experimentsVariantSyncServiceApi.SyncVariantsRequest, experimentsVariantSyncServiceApi.SyncVariantsResponse>, done: sendUnaryData<experimentsVariantSyncServiceApi.SyncVariantsResponse>): void => {
    void this.workflow.syncVariants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: VariantSyncHandler): experimentsVariantSyncServiceApi.VariantSyncServiceServer {
  return {
    getVariantSyncState: handler.getVariantSyncState,
    listVariantConflicts: handler.listVariantConflicts,
    pullVariants: handler.pullVariants,
    pushVariant: handler.pushVariant,
    reconcileVariants: handler.reconcileVariants,
    resolveVariantConflict: handler.resolveVariantConflict,
    streamVariantChanges: handler.streamVariantChanges,
    syncVariants: handler.syncVariants,
  };
}
