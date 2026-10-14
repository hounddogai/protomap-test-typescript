/**
 * Runs the long-lived workflow that takes a channel from start to finish.
 */

import * as messagingChannelWorkflowServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChannelWorkflowWorkflow } from "./channel-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChannelWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelWorkflowHandler {
  constructor(@inject(ChannelWorkflowWorkflow) private readonly workflow: ChannelWorkflowWorkflow) {}

  /**
   * Advances a channel.
   */
  advanceChannelWorkflow = unary<messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowRequest, messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowResponse>(
    (request) => this.workflow.advanceChannelWorkflow(request),
  );

  /**
   * Cancels a channel.
   */
  cancelChannelWorkflow = (call: ServerUnaryCall<messagingChannelWorkflowServiceApi.CancelChannelWorkflowRequest, messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse>, done: sendUnaryData<messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse>): void => {
    void this.workflow.cancelChannelWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a channel.
   */
  inspectChannelWorkflow = unary<messagingChannelWorkflowServiceApi.InspectChannelWorkflowRequest, messagingChannelWorkflowServiceApi.InspectChannelWorkflowResponse>(
    (request) => this.workflow.inspectChannelWorkflow(request),
  );

  /**
   * Lists channels a page at a time.
   */
  listChannelWorkflows = unary<messagingChannelWorkflowServiceApi.ListChannelWorkflowsRequest, messagingChannelWorkflowServiceApi.ListChannelWorkflowsResponse>(
    (request) => this.workflow.listChannelWorkflows(request),
  );

  /**
   * Resumes a channel.
   */
  resumeChannelWorkflow = (call: ServerUnaryCall<messagingChannelWorkflowServiceApi.ResumeChannelWorkflowRequest, messagingChannelWorkflowServiceApi.ResumeChannelWorkflowResponse>, done: sendUnaryData<messagingChannelWorkflowServiceApi.ResumeChannelWorkflowResponse>): void => {
    void this.workflow.resumeChannelWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a channel.
   */
  signalChannelWorkflow = unary<messagingChannelWorkflowServiceApi.SignalChannelWorkflowRequest, messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse>(
    (request) => this.workflow.signalChannelWorkflow(request),
  );

  /**
   * Starts a channel.
   */
  startChannelWorkflow = unary<messagingChannelWorkflowServiceApi.StartChannelWorkflowRequest, messagingChannelWorkflowServiceApi.StartChannelWorkflowResponse>(
    (request) => this.workflow.startChannelWorkflow(request),
  );
}

export function implementation(handler: ChannelWorkflowHandler): messagingChannelWorkflowServiceApi.ChannelWorkflowServiceServer {
  return {
    advanceChannelWorkflow: handler.advanceChannelWorkflow,
    cancelChannelWorkflow: handler.cancelChannelWorkflow,
    inspectChannelWorkflow: handler.inspectChannelWorkflow,
    listChannelWorkflows: handler.listChannelWorkflows,
    resumeChannelWorkflow: handler.resumeChannelWorkflow,
    signalChannelWorkflow: handler.signalChannelWorkflow,
    startChannelWorkflow: handler.startChannelWorkflow,
  };
}
