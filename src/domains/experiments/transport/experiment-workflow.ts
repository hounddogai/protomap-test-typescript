/**
 * Runs the long-lived workflow that takes an experiment from start to finish.
 */

import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ExperimentWorkflowWorkflow } from "../application/experiment-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentWorkflowHandler {
  constructor(@inject(ExperimentWorkflowWorkflow) private readonly workflow: ExperimentWorkflowWorkflow) {}

  /**
   * Advances an experiment.
   */
  advanceExperimentWorkflow = (call: ServerUnaryCall<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse>, done: sendUnaryData<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse>): void => {
    void this.workflow.advanceExperimentWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels an experiment.
   */
  cancelExperimentWorkflow = unary<experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse>(
    (request) => this.workflow.cancelExperimentWorkflow(request),
  );

  /**
   * Returns an experiment.
   */
  inspectExperimentWorkflow = unary<experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowResponse>(
    (request) => this.workflow.inspectExperimentWorkflow(request),
  );

  /**
   * Lists experiments a page at a time.
   */
  listExperimentWorkflows = (call: ServerUnaryCall<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest, experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse>, done: sendUnaryData<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse>): void => {
    void this.workflow.listExperimentWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses an experiment.
   */
  pauseExperimentWorkflow = unary<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse>(
    (request) => this.workflow.pauseExperimentWorkflow(request),
  );

  /**
   * Resumes an experiment.
   */
  resumeExperimentWorkflow = unary<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse>(
    (request) => this.workflow.resumeExperimentWorkflow(request),
  );

  /**
   * Signals an experiment.
   */
  signalExperimentWorkflow = (call: ServerUnaryCall<experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse>, done: sendUnaryData<experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse>): void => {
    void this.workflow.signalExperimentWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts an experiment.
   */
  startExperimentWorkflow = unary<experimentsExperimentWorkflowServiceApi.StartExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.StartExperimentWorkflowResponse>(
    (request) => this.workflow.startExperimentWorkflow(request),
  );
}

export function implementation(handler: ExperimentWorkflowHandler): experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceServer {
  return {
    advanceExperimentWorkflow: handler.advanceExperimentWorkflow,
    cancelExperimentWorkflow: handler.cancelExperimentWorkflow,
    inspectExperimentWorkflow: handler.inspectExperimentWorkflow,
    listExperimentWorkflows: handler.listExperimentWorkflows,
    pauseExperimentWorkflow: handler.pauseExperimentWorkflow,
    resumeExperimentWorkflow: handler.resumeExperimentWorkflow,
    signalExperimentWorkflow: handler.signalExperimentWorkflow,
    startExperimentWorkflow: handler.startExperimentWorkflow,
  };
}
