/**
 * Runs the long-lived workflow that takes an affinity from start to finish.
 */

import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AffinityWorkflowWorkflow } from "../application/affinity-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityWorkflowHandler {
  constructor(@inject(AffinityWorkflowWorkflow) private readonly workflow: AffinityWorkflowWorkflow) {}

  /**
   * Advances an affinity.
   */
  advanceAffinityWorkflow = (call: ServerUnaryCall<personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse>, done: sendUnaryData<personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse>): void => {
    void this.workflow.advanceAffinityWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an affinity.
   */
  inspectAffinityWorkflow = unary<personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowResponse>(
    (request) => this.workflow.inspectAffinityWorkflow(request),
  );

  /**
   * Lists affinities a page at a time.
   */
  listAffinityWorkflows = unary<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest, personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse>(
    (request) => this.workflow.listAffinityWorkflows(request),
  );

  /**
   * Resumes an affinity.
   */
  resumeAffinityWorkflow = (call: ServerUnaryCall<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse>, done: sendUnaryData<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse>): void => {
    void this.workflow.resumeAffinityWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals an affinity.
   */
  signalAffinityWorkflow = unary<personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse>(
    (request) => this.workflow.signalAffinityWorkflow(request),
  );

  /**
   * Starts an affinity.
   */
  startAffinityWorkflow = unary<personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse>(
    (request) => this.workflow.startAffinityWorkflow(request),
  );
}

export function implementation(handler: AffinityWorkflowHandler): personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceServer {
  return {
    advanceAffinityWorkflow: handler.advanceAffinityWorkflow,
    inspectAffinityWorkflow: handler.inspectAffinityWorkflow,
    listAffinityWorkflows: handler.listAffinityWorkflows,
    resumeAffinityWorkflow: handler.resumeAffinityWorkflow,
    signalAffinityWorkflow: handler.signalAffinityWorkflow,
    startAffinityWorkflow: handler.startAffinityWorkflow,
  };
}
