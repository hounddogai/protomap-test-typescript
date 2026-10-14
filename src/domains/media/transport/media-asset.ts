/**
 * Manages media assets: creates, reads, changes, and lists them.
 */

import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { MediaAssetWorkflow } from "../application/media-asset.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetHandler {
  constructor(@inject(MediaAssetWorkflow) private readonly workflow: MediaAssetWorkflow) {}

  /**
   * Takes a stream of media assets and answers once at the end.
   */
  batchCreateMediaAssets = clientStream<mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest, mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse>(
    (request) => this.workflow.batchCreateMediaAssets(request), () => mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse.fromPartial({}),
  );

  /**
   * Returns several media assets at once.
   */
  batchGetMediaAssets = unary<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse>(
    (request) => this.workflow.batchGetMediaAssets(request),
  );

  /**
   * Creates a media asset.
   */
  createMediaAsset = unary<mediaMediaAssetServiceApi.CreateMediaAssetRequest, mediaMediaAssetServiceApi.CreateMediaAssetResponse>(
    (request) => this.workflow.createMediaAsset(request),
  );

  /**
   * Returns a media asset.
   */
  getMediaAsset = (call: ServerUnaryCall<mediaMediaAssetServiceApi.GetMediaAssetRequest, mediaMediaAssetServiceApi.GetMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetServiceApi.GetMediaAssetResponse>): void => {
    void this.workflow.getMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists media assets a page at a time.
   */
  listMediaAssets = unary<mediaMediaAssetServiceApi.ListMediaAssetsRequest, mediaMediaAssetServiceApi.ListMediaAssetsResponse>(
    (request) => this.workflow.listMediaAssets(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  searchMediaAssets = unary<mediaMediaAssetServiceApi.SearchMediaAssetsRequest, mediaMediaAssetServiceApi.SearchMediaAssetsResponse>(
    (request) => this.workflow.searchMediaAssets(request),
  );

  /**
   * Changes a media asset.
   */
  updateMediaAsset = (call: ServerUnaryCall<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse>, done: sendUnaryData<mediaMediaAssetServiceApi.UpdateMediaAssetResponse>): void => {
    void this.workflow.updateMediaAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of media assets as they happen.
   */
  watchMediaAssets = serverStream<mediaMediaAssetServiceApi.WatchMediaAssetsRequest, mediaMediaAssetServiceApi.WatchMediaAssetsResponse>(
    (request) => this.workflow.watchMediaAssets(request),
  );
}

export function implementation(handler: MediaAssetHandler): mediaMediaAssetServiceApi.MediaAssetServiceServer {
  return {
    batchCreateMediaAssets: handler.batchCreateMediaAssets,
    batchGetMediaAssets: handler.batchGetMediaAssets,
    createMediaAsset: handler.createMediaAsset,
    getMediaAsset: handler.getMediaAsset,
    listMediaAssets: handler.listMediaAssets,
    searchMediaAssets: handler.searchMediaAssets,
    updateMediaAsset: handler.updateMediaAsset,
    watchMediaAssets: handler.watchMediaAssets,
  };
}
