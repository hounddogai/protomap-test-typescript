/**
 * Keeps channels in step with the systems of record in other regions.
 */

import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import { serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { ChannelSyncWorkflow } from "../application/channel-sync.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChannelSyncService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelSyncHandler {
  constructor(@inject(ChannelSyncWorkflow) private readonly workflow: ChannelSyncWorkflow) {}

  /**
   * Returns a channel.
   */
  getChannelSyncState = (call: ServerUnaryCall<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>, done: sendUnaryData<messagingChannelSyncServiceApi.GetChannelSyncStateResponse>): void => {
    void this.workflow.getChannelSyncState(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists channels a page at a time.
   */
  listChannelConflicts = unary<messagingChannelSyncServiceApi.ListChannelConflictsRequest, messagingChannelSyncServiceApi.ListChannelConflictsResponse>(
    (request) => this.workflow.listChannelConflicts(request),
  );

  /**
   * Pulls a channel.
   */
  pullChannels = unary<messagingChannelSyncServiceApi.PullChannelsRequest, messagingChannelSyncServiceApi.PullChannelsResponse>(
    (request) => this.workflow.pullChannels(request),
  );

  /**
   * Pushs a channel.
   */
  pushChannel = (call: ServerUnaryCall<messagingChannelSyncServiceApi.PushChannelRequest, messagingChannelSyncServiceApi.PushChannelResponse>, done: sendUnaryData<messagingChannelSyncServiceApi.PushChannelResponse>): void => {
    void this.workflow.pushChannel(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reconciles a channel.
   */
  reconcileChannels = unary<messagingChannelSyncServiceApi.ReconcileChannelsRequest, messagingChannelSyncServiceApi.ReconcileChannelsResponse>(
    (request) => this.workflow.reconcileChannels(request),
  );

  /**
   * Resolves a channel.
   */
  resolveChannelConflict = unary<messagingChannelSyncServiceApi.ResolveChannelConflictRequest, messagingChannelSyncServiceApi.ResolveChannelConflictResponse>(
    (request) => this.workflow.resolveChannelConflict(request),
  );

  /**
   * Exchanges changes of channels with a peer.
   */
  streamChannelChanges = duplex<messagingChannelSyncServiceApi.StreamChannelChangesRequest, messagingChannelSyncServiceApi.StreamChannelChangesResponse>(
    (request) => this.workflow.streamChannelChanges(request),
  );

  /**
   * Syncs a channel.
   */
  syncChannels = unary<messagingChannelSyncServiceApi.SyncChannelsRequest, messagingChannelSyncServiceApi.SyncChannelsResponse>(
    (request) => this.workflow.syncChannels(request),
  );
}

export function implementation(handler: ChannelSyncHandler): messagingChannelSyncServiceApi.ChannelSyncServiceServer {
  return {
    getChannelSyncState: handler.getChannelSyncState,
    listChannelConflicts: handler.listChannelConflicts,
    pullChannels: handler.pullChannels,
    pushChannel: handler.pushChannel,
    reconcileChannels: handler.reconcileChannels,
    resolveChannelConflict: handler.resolveChannelConflict,
    streamChannelChanges: handler.streamChannelChanges,
    syncChannels: handler.syncChannels,
  };
}
