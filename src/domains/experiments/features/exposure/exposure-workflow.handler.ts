/**
 * Runs the long-lived workflow that takes an exposure from start to finish.
 */

import * as experimentsExposureWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ExposureWorkflowWorkflow } from "./exposure-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExposureWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureWorkflowHandler {
  constructor(@inject(ExposureWorkflowWorkflow) private readonly workflow: ExposureWorkflowWorkflow) {}

  /**
   * Advances an exposure.
   */
  advanceExposureWorkflow = unary<experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.AdvanceExposureWorkflowResponse>(
    (request) => this.workflow.advanceExposureWorkflow(request),
  );

  /**
   * Cancels an exposure.
   */
  cancelExposureWorkflow = (call: ServerUnaryCall<experimentsExposureWorkflowServiceApi.CancelExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.CancelExposureWorkflowResponse>, done: sendUnaryData<experimentsExposureWorkflowServiceApi.CancelExposureWorkflowResponse>): void => {
    void this.workflow.cancelExposureWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an exposure.
   */
  inspectExposureWorkflow = unary<experimentsExposureWorkflowServiceApi.InspectExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.InspectExposureWorkflowResponse>(
    (request) => this.workflow.inspectExposureWorkflow(request),
  );

  /**
   * Lists exposures a page at a time.
   */
  listExposureWorkflows = unary<experimentsExposureWorkflowServiceApi.ListExposureWorkflowsRequest, experimentsExposureWorkflowServiceApi.ListExposureWorkflowsResponse>(
    (request) => this.workflow.listExposureWorkflows(request),
  );

  /**
   * Pauses an exposure.
   */
  pauseExposureWorkflow = (call: ServerUnaryCall<experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse>, done: sendUnaryData<experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse>): void => {
    void this.workflow.pauseExposureWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes an exposure.
   */
  resumeExposureWorkflow = unary<experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse>(
    (request) => this.workflow.resumeExposureWorkflow(request),
  );

  /**
   * Retrys an exposure.
   */
  retryExposureWorkflow = unary<experimentsExposureWorkflowServiceApi.RetryExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse>(
    (request) => this.workflow.retryExposureWorkflow(request),
  );

  /**
   * Signals an exposure.
   */
  signalExposureWorkflow = (call: ServerUnaryCall<experimentsExposureWorkflowServiceApi.SignalExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse>, done: sendUnaryData<experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse>): void => {
    void this.workflow.signalExposureWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts an exposure.
   */
  startExposureWorkflow = unary<experimentsExposureWorkflowServiceApi.StartExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.StartExposureWorkflowResponse>(
    (request) => this.workflow.startExposureWorkflow(request),
  );
}

export function implementation(handler: ExposureWorkflowHandler): experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceServer {
  return {
    advanceExposureWorkflow: handler.advanceExposureWorkflow,
    cancelExposureWorkflow: handler.cancelExposureWorkflow,
    inspectExposureWorkflow: handler.inspectExposureWorkflow,
    listExposureWorkflows: handler.listExposureWorkflows,
    pauseExposureWorkflow: handler.pauseExposureWorkflow,
    resumeExposureWorkflow: handler.resumeExposureWorkflow,
    retryExposureWorkflow: handler.retryExposureWorkflow,
    signalExposureWorkflow: handler.signalExposureWorkflow,
    startExposureWorkflow: handler.startExposureWorkflow,
  };
}
