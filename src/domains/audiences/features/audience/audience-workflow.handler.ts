/**
 * Runs the long-lived workflow that takes an audience from start to finish.
 */

import * as audiencesAudienceWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AudienceWorkflowWorkflow } from "./audience-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceWorkflowHandler {
  constructor(@inject(AudienceWorkflowWorkflow) private readonly workflow: AudienceWorkflowWorkflow) {}

  /**
   * Advances an audience.
   */
  advanceAudienceWorkflow = unary<audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowResponse>(
    (request) => this.workflow.advanceAudienceWorkflow(request),
  );

  /**
   * Cancels an audience.
   */
  cancelAudienceWorkflow = (call: ServerUnaryCall<audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse>, done: sendUnaryData<audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse>): void => {
    void this.workflow.cancelAudienceWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience.
   */
  inspectAudienceWorkflow = unary<audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowResponse>(
    (request) => this.workflow.inspectAudienceWorkflow(request),
  );

  /**
   * Lists audiences a page at a time.
   */
  listAudienceWorkflows = unary<audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest, audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse>(
    (request) => this.workflow.listAudienceWorkflows(request),
  );

  /**
   * Pauses an audience.
   */
  pauseAudienceWorkflow = (call: ServerUnaryCall<audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse>, done: sendUnaryData<audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse>): void => {
    void this.workflow.pauseAudienceWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes an audience.
   */
  resumeAudienceWorkflow = unary<audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowResponse>(
    (request) => this.workflow.resumeAudienceWorkflow(request),
  );

  /**
   * Retrys an audience.
   */
  retryAudienceWorkflow = unary<audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse>(
    (request) => this.workflow.retryAudienceWorkflow(request),
  );

  /**
   * Signals an audience.
   */
  signalAudienceWorkflow = (call: ServerUnaryCall<audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse>, done: sendUnaryData<audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse>): void => {
    void this.workflow.signalAudienceWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts an audience.
   */
  startAudienceWorkflow = unary<audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse>(
    (request) => this.workflow.startAudienceWorkflow(request),
  );
}

export function implementation(handler: AudienceWorkflowHandler): audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceServer {
  return {
    advanceAudienceWorkflow: handler.advanceAudienceWorkflow,
    cancelAudienceWorkflow: handler.cancelAudienceWorkflow,
    inspectAudienceWorkflow: handler.inspectAudienceWorkflow,
    listAudienceWorkflows: handler.listAudienceWorkflows,
    pauseAudienceWorkflow: handler.pauseAudienceWorkflow,
    resumeAudienceWorkflow: handler.resumeAudienceWorkflow,
    retryAudienceWorkflow: handler.retryAudienceWorkflow,
    signalAudienceWorkflow: handler.signalAudienceWorkflow,
    startAudienceWorkflow: handler.startAudienceWorkflow,
  };
}
