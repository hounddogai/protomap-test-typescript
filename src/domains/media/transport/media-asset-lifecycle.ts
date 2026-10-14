/**
 * Moves a media asset between the states of its lifecycle.
 */

import * as mediaMediaAssetLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { MediaAssetLifecycleWorkflow } from "../application/media-asset-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetLifecycleHandler {
  constructor(@inject(MediaAssetLifecycleWorkflow) private readonly workflow: MediaAssetLifecycleWorkflow) {}

  /**
   * Activates a media asset.
   */
  activateMediaAsset = (call: ServerUnaryCall<mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse>): void => {
    void this.workflow.activateMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a media asset.
   */
  reinstateMediaAsset = unary<mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse>(
    (request) => this.workflow.reinstateMediaAsset(request),
  );

  /**
   * Renews a media asset.
   */
  renewMediaAsset = unary<mediaMediaAssetLifecycleServiceApi.RenewMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.RenewMediaAssetResponse>(
    (request) => this.workflow.renewMediaAsset(request),
  );

  /**
   * Schedules a media asset.
   */
  scheduleMediaAssetExpiry = (call: ServerUnaryCall<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest, mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse>, done: sendUnaryData<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse>): void => {
    void this.workflow.scheduleMediaAssetExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a media asset.
   */
  suspendMediaAsset = unary<mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse>(
    (request) => this.workflow.suspendMediaAsset(request),
  );

  /**
   * Terminates a media asset.
   */
  terminateMediaAsset = unary<mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse>(
    (request) => this.workflow.terminateMediaAsset(request),
  );
}

export function implementation(handler: MediaAssetLifecycleHandler): mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceServer {
  return {
    activateMediaAsset: handler.activateMediaAsset,
    reinstateMediaAsset: handler.reinstateMediaAsset,
    renewMediaAsset: handler.renewMediaAsset,
    scheduleMediaAssetExpiry: handler.scheduleMediaAssetExpiry,
    suspendMediaAsset: handler.suspendMediaAsset,
    terminateMediaAsset: handler.terminateMediaAsset,
  };
}
