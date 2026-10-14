/**
 * Runs the long-lived workflow that takes a rendition from start to finish.
 */

import * as mediaRenditionWorkflowServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { RenditionWorkflowWorkflow } from "./rendition-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RenditionWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionWorkflowHandler {
  constructor(@inject(RenditionWorkflowWorkflow) private readonly workflow: RenditionWorkflowWorkflow) {}

  /**
   * Advances a rendition.
   */
  advanceRenditionWorkflow = unary<mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowResponse>(
    (request) => this.workflow.advanceRenditionWorkflow(request),
  );

  /**
   * Cancels a rendition.
   */
  cancelRenditionWorkflow = (call: ServerUnaryCall<mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse>, done: sendUnaryData<mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse>): void => {
    void this.workflow.cancelRenditionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a rendition.
   */
  inspectRenditionWorkflow = unary<mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowResponse>(
    (request) => this.workflow.inspectRenditionWorkflow(request),
  );

  /**
   * Lists renditions a page at a time.
   */
  listRenditionWorkflows = unary<mediaRenditionWorkflowServiceApi.ListRenditionWorkflowsRequest, mediaRenditionWorkflowServiceApi.ListRenditionWorkflowsResponse>(
    (request) => this.workflow.listRenditionWorkflows(request),
  );

  /**
   * Pauses a rendition.
   */
  pauseRenditionWorkflow = (call: ServerUnaryCall<mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse>, done: sendUnaryData<mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse>): void => {
    void this.workflow.pauseRenditionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a rendition.
   */
  retryRenditionWorkflow = unary<mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse>(
    (request) => this.workflow.retryRenditionWorkflow(request),
  );

  /**
   * Signals a rendition.
   */
  signalRenditionWorkflow = unary<mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowResponse>(
    (request) => this.workflow.signalRenditionWorkflow(request),
  );

  /**
   * Starts a rendition.
   */
  startRenditionWorkflow = (call: ServerUnaryCall<mediaRenditionWorkflowServiceApi.StartRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse>, done: sendUnaryData<mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse>): void => {
    void this.workflow.startRenditionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: RenditionWorkflowHandler): mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceServer {
  return {
    advanceRenditionWorkflow: handler.advanceRenditionWorkflow,
    cancelRenditionWorkflow: handler.cancelRenditionWorkflow,
    inspectRenditionWorkflow: handler.inspectRenditionWorkflow,
    listRenditionWorkflows: handler.listRenditionWorkflows,
    pauseRenditionWorkflow: handler.pauseRenditionWorkflow,
    retryRenditionWorkflow: handler.retryRenditionWorkflow,
    signalRenditionWorkflow: handler.signalRenditionWorkflow,
    startRenditionWorkflow: handler.startRenditionWorkflow,
  };
}
