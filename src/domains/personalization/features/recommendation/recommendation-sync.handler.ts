/**
 * Keeps recommendations in step with the systems of record in other regions.
 */

import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { duplex, unary } from "../../../../platform/handlers.js";
import { RecommendationSyncWorkflow } from "./recommendation-sync.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RecommendationSyncService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationSyncHandler {
  constructor(@inject(RecommendationSyncWorkflow) private readonly workflow: RecommendationSyncWorkflow) {}

  /**
   * Returns a recommendation.
   */
  getRecommendationSyncState = unary<personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateRequest, personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateResponse>(
    (request) => this.workflow.getRecommendationSyncState(request),
  );

  /**
   * Lists recommendations a page at a time.
   */
  listRecommendationConflicts = (call: ServerUnaryCall<personalizationRecommendationSyncServiceApi.ListRecommendationConflictsRequest, personalizationRecommendationSyncServiceApi.ListRecommendationConflictsResponse>, done: sendUnaryData<personalizationRecommendationSyncServiceApi.ListRecommendationConflictsResponse>): void => {
    void this.workflow.listRecommendationConflicts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls a recommendation.
   */
  pullRecommendations = unary<personalizationRecommendationSyncServiceApi.PullRecommendationsRequest, personalizationRecommendationSyncServiceApi.PullRecommendationsResponse>(
    (request) => this.workflow.pullRecommendations(request),
  );

  /**
   * Pushs a recommendation.
   */
  pushRecommendation = unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(
    (request) => this.workflow.pushRecommendation(request),
  );

  /**
   * Reconciles a recommendation.
   */
  reconcileRecommendations = (call: ServerUnaryCall<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest, personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse>): void => {
    void this.workflow.reconcileRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves a recommendation.
   */
  resolveRecommendationConflict = unary<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest, personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse>(
    (request) => this.workflow.resolveRecommendationConflict(request),
  );

  /**
   * Exchanges changes of recommendations with a peer.
   */
  streamRecommendationChanges = duplex<personalizationRecommendationSyncServiceApi.StreamRecommendationChangesRequest, personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse>(
    (request) => this.workflow.streamRecommendationChanges(request),
  );

  /**
   * Syncs a recommendation.
   */
  syncRecommendations = (call: ServerUnaryCall<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse>): void => {
    void this.workflow.syncRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: RecommendationSyncHandler): personalizationRecommendationSyncServiceApi.RecommendationSyncServiceServer {
  return {
    getRecommendationSyncState: handler.getRecommendationSyncState,
    listRecommendationConflicts: handler.listRecommendationConflicts,
    pullRecommendations: handler.pullRecommendations,
    pushRecommendation: handler.pushRecommendation,
    reconcileRecommendations: handler.reconcileRecommendations,
    resolveRecommendationConflict: handler.resolveRecommendationConflict,
    streamRecommendationChanges: handler.streamRecommendationChanges,
    syncRecommendations: handler.syncRecommendations,
  };
}
