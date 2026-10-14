/**
 * Runs the long-lived workflow that takes a handoff from start to finish.
 */

import * as chatHandoffWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { HandoffWorkflowWorkflow } from "../application/handoff-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for HandoffWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffWorkflowHandler {
  constructor(@inject(HandoffWorkflowWorkflow) private readonly workflow: HandoffWorkflowWorkflow) {}

  /**
   * Advances a handoff.
   */
  advanceHandoffWorkflow = (call: ServerUnaryCall<chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse>, done: sendUnaryData<chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse>): void => {
    void this.workflow.advanceHandoffWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a handoff.
   */
  cancelHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse>(
    (request) => this.workflow.cancelHandoffWorkflow(request),
  );

  /**
   * Returns a handoff.
   */
  inspectHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.InspectHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.InspectHandoffWorkflowResponse>(
    (request) => this.workflow.inspectHandoffWorkflow(request),
  );

  /**
   * Lists handoffs a page at a time.
   */
  listHandoffWorkflows = (call: ServerUnaryCall<chatHandoffWorkflowServiceApi.ListHandoffWorkflowsRequest, chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse>, done: sendUnaryData<chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse>): void => {
    void this.workflow.listHandoffWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a handoff.
   */
  pauseHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.PauseHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse>(
    (request) => this.workflow.pauseHandoffWorkflow(request),
  );

  /**
   * Resumes a handoff.
   */
  resumeHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse>(
    (request) => this.workflow.resumeHandoffWorkflow(request),
  );

  /**
   * Retrys a handoff.
   */
  retryHandoffWorkflow = (call: ServerUnaryCall<chatHandoffWorkflowServiceApi.RetryHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse>, done: sendUnaryData<chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse>): void => {
    void this.workflow.retryHandoffWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a handoff.
   */
  signalHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse>(
    (request) => this.workflow.signalHandoffWorkflow(request),
  );

  /**
   * Starts a handoff.
   */
  startHandoffWorkflow = unary<chatHandoffWorkflowServiceApi.StartHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse>(
    (request) => this.workflow.startHandoffWorkflow(request),
  );
}

export function implementation(handler: HandoffWorkflowHandler): chatHandoffWorkflowServiceApi.HandoffWorkflowServiceServer {
  return {
    advanceHandoffWorkflow: handler.advanceHandoffWorkflow,
    cancelHandoffWorkflow: handler.cancelHandoffWorkflow,
    inspectHandoffWorkflow: handler.inspectHandoffWorkflow,
    listHandoffWorkflows: handler.listHandoffWorkflows,
    pauseHandoffWorkflow: handler.pauseHandoffWorkflow,
    resumeHandoffWorkflow: handler.resumeHandoffWorkflow,
    retryHandoffWorkflow: handler.retryHandoffWorkflow,
    signalHandoffWorkflow: handler.signalHandoffWorkflow,
    startHandoffWorkflow: handler.startHandoffWorkflow,
  };
}
