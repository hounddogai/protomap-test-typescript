/**
 * Keeps subscriptions in step with the systems of record in other regions.
 */

import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { SubscriptionSyncWorkflow } from "../application/subscription-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SubscriptionSyncService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionSyncHandler {
  constructor(@inject(SubscriptionSyncWorkflow) private readonly workflow: SubscriptionSyncWorkflow) {}

  /**
   * Returns a subscription.
   */
  getSubscriptionSyncState = (call: ServerUnaryCall<notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateRequest, notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateResponse>, done: sendUnaryData<notificationsSubscriptionSyncServiceApi.GetSubscriptionSyncStateResponse>): void => {
    void this.workflow.getSubscriptionSyncState(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists subscriptions a page at a time.
   */
  listSubscriptionConflicts = unary<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
    (request) => this.workflow.listSubscriptionConflicts(request),
  );

  /**
   * Pulls a subscription.
   */
  pullSubscriptions = unary<notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse>(
    (request) => this.workflow.pullSubscriptions(request),
  );

  /**
   * Pushs a subscription.
   */
  pushSubscription = (call: ServerUnaryCall<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse>, done: sendUnaryData<notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse>): void => {
    void this.workflow.pushSubscription(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reconciles a subscription.
   */
  reconcileSubscriptions = unary<notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse>(
    (request) => this.workflow.reconcileSubscriptions(request),
  );

  /**
   * Resolves a subscription.
   */
  resolveSubscriptionConflict = unary<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse>(
    (request) => this.workflow.resolveSubscriptionConflict(request),
  );

  /**
   * Exchanges changes of subscriptions with a peer.
   */
  streamSubscriptionChanges = duplex<notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest, notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse>(
    (request) => this.workflow.streamSubscriptionChanges(request),
  );

  /**
   * Syncs a subscription.
   */
  syncSubscriptions = unary<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse>(
    (request) => this.workflow.syncSubscriptions(request),
  );
}

export function implementation(handler: SubscriptionSyncHandler): notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceServer {
  return {
    getSubscriptionSyncState: handler.getSubscriptionSyncState,
    listSubscriptionConflicts: handler.listSubscriptionConflicts,
    pullSubscriptions: handler.pullSubscriptions,
    pushSubscription: handler.pushSubscription,
    reconcileSubscriptions: handler.reconcileSubscriptions,
    resolveSubscriptionConflict: handler.resolveSubscriptionConflict,
    streamSubscriptionChanges: handler.streamSubscriptionChanges,
    syncSubscriptions: handler.syncSubscriptions,
  };
}
