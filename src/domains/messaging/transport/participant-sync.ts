/**
 * Keeps participants in step with the systems of record in other regions.
 */

import * as messagingParticipantSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { ParticipantSyncWorkflow } from "../application/participant-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ParticipantSyncService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantSyncHandler {
  constructor(@inject(ParticipantSyncWorkflow) private readonly workflow: ParticipantSyncWorkflow) {}

  /**
   * Returns a participant.
   */
  getParticipantSyncState = (call: ServerUnaryCall<messagingParticipantSyncServiceApi.GetParticipantSyncStateRequest, messagingParticipantSyncServiceApi.GetParticipantSyncStateResponse>, done: sendUnaryData<messagingParticipantSyncServiceApi.GetParticipantSyncStateResponse>): void => {
    void this.workflow.getParticipantSyncState(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists participants a page at a time.
   */
  listParticipantConflicts = unary<messagingParticipantSyncServiceApi.ListParticipantConflictsRequest, messagingParticipantSyncServiceApi.ListParticipantConflictsResponse>(
    (request) => this.workflow.listParticipantConflicts(request),
  );

  /**
   * Pulls a participant.
   */
  pullParticipants = unary<messagingParticipantSyncServiceApi.PullParticipantsRequest, messagingParticipantSyncServiceApi.PullParticipantsResponse>(
    (request) => this.workflow.pullParticipants(request),
  );

  /**
   * Pushs a participant.
   */
  pushParticipant = (call: ServerUnaryCall<messagingParticipantSyncServiceApi.PushParticipantRequest, messagingParticipantSyncServiceApi.PushParticipantResponse>, done: sendUnaryData<messagingParticipantSyncServiceApi.PushParticipantResponse>): void => {
    void this.workflow.pushParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reconciles a participant.
   */
  reconcileParticipants = unary<messagingParticipantSyncServiceApi.ReconcileParticipantsRequest, messagingParticipantSyncServiceApi.ReconcileParticipantsResponse>(
    (request) => this.workflow.reconcileParticipants(request),
  );

  /**
   * Resolves a participant.
   */
  resolveParticipantConflict = unary<messagingParticipantSyncServiceApi.ResolveParticipantConflictRequest, messagingParticipantSyncServiceApi.ResolveParticipantConflictResponse>(
    (request) => this.workflow.resolveParticipantConflict(request),
  );

  /**
   * Exchanges changes of participants with a peer.
   */
  streamParticipantChanges = duplex<messagingParticipantSyncServiceApi.StreamParticipantChangesRequest, messagingParticipantSyncServiceApi.StreamParticipantChangesResponse>(
    (request) => this.workflow.streamParticipantChanges(request),
  );

  /**
   * Syncs a participant.
   */
  syncParticipants = unary<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse>(
    (request) => this.workflow.syncParticipants(request),
  );
}

export function implementation(handler: ParticipantSyncHandler): messagingParticipantSyncServiceApi.ParticipantSyncServiceServer {
  return {
    getParticipantSyncState: handler.getParticipantSyncState,
    listParticipantConflicts: handler.listParticipantConflicts,
    pullParticipants: handler.pullParticipants,
    pushParticipant: handler.pushParticipant,
    reconcileParticipants: handler.reconcileParticipants,
    resolveParticipantConflict: handler.resolveParticipantConflict,
    streamParticipantChanges: handler.streamParticipantChanges,
    syncParticipants: handler.syncParticipants,
  };
}
