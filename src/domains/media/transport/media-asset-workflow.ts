/**
 * Runs the long-lived workflow that takes a media asset from start to finish.
 */

import * as mediaMediaAssetWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { MediaAssetWorkflowWorkflow } from "../application/media-asset-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MediaAssetWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetWorkflowHandler {
  constructor(@inject(MediaAssetWorkflowWorkflow) private readonly workflow: MediaAssetWorkflowWorkflow) {}

  /**
   * Advances a media asset.
   */
  advanceMediaAssetWorkflow = (call: ServerUnaryCall<mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse>, done: sendUnaryData<mediaMediaAssetWorkflowServiceApi.AdvanceMediaAssetWorkflowResponse>): void => {
    void this.workflow.advanceMediaAssetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a media asset.
   */
  cancelMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.CancelMediaAssetWorkflowResponse>(
    (request) => this.workflow.cancelMediaAssetWorkflow(request),
  );

  /**
   * Returns a media asset.
   */
  inspectMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.InspectMediaAssetWorkflowResponse>(
    (request) => this.workflow.inspectMediaAssetWorkflow(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  listMediaAssetWorkflows = (call: ServerUnaryCall<mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsRequest, mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsResponse>, done: sendUnaryData<mediaMediaAssetWorkflowServiceApi.ListMediaAssetWorkflowsResponse>): void => {
    void this.workflow.listMediaAssetWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a media asset.
   */
  pauseMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse>(
    (request) => this.workflow.pauseMediaAssetWorkflow(request),
  );

  /**
   * Resumes a media asset.
   */
  resumeMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowResponse>(
    (request) => this.workflow.resumeMediaAssetWorkflow(request),
  );

  /**
   * Retrys a media asset.
   */
  retryMediaAssetWorkflow = (call: ServerUnaryCall<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse>, done: sendUnaryData<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse>): void => {
    void this.workflow.retryMediaAssetWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a media asset.
   */
  signalMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse>(
    (request) => this.workflow.signalMediaAssetWorkflow(request),
  );

  /**
   * Starts a media asset.
   */
  startMediaAssetWorkflow = unary<mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse>(
    (request) => this.workflow.startMediaAssetWorkflow(request),
  );
}

export function implementation(handler: MediaAssetWorkflowHandler): mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceServer {
  return {
    advanceMediaAssetWorkflow: handler.advanceMediaAssetWorkflow,
    cancelMediaAssetWorkflow: handler.cancelMediaAssetWorkflow,
    inspectMediaAssetWorkflow: handler.inspectMediaAssetWorkflow,
    listMediaAssetWorkflows: handler.listMediaAssetWorkflows,
    pauseMediaAssetWorkflow: handler.pauseMediaAssetWorkflow,
    resumeMediaAssetWorkflow: handler.resumeMediaAssetWorkflow,
    retryMediaAssetWorkflow: handler.retryMediaAssetWorkflow,
    signalMediaAssetWorkflow: handler.signalMediaAssetWorkflow,
    startMediaAssetWorkflow: handler.startMediaAssetWorkflow,
  };
}
