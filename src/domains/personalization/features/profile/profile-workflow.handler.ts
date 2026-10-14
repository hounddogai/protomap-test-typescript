/**
 * Runs the long-lived workflow that takes a profile from start to finish.
 */

import * as personalizationProfileWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ProfileWorkflowWorkflow } from "./profile-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ProfileWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileWorkflowHandler {
  constructor(@inject(ProfileWorkflowWorkflow) private readonly workflow: ProfileWorkflowWorkflow) {}

  /**
   * Advances a profile.
   */
  advanceProfileWorkflow = unary<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse>(
    (request) => this.workflow.advanceProfileWorkflow(request),
  );

  /**
   * Cancels a profile.
   */
  cancelProfileWorkflow = (call: ServerUnaryCall<personalizationProfileWorkflowServiceApi.CancelProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse>, done: sendUnaryData<personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse>): void => {
    void this.workflow.cancelProfileWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a profile.
   */
  inspectProfileWorkflow = unary<personalizationProfileWorkflowServiceApi.InspectProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.InspectProfileWorkflowResponse>(
    (request) => this.workflow.inspectProfileWorkflow(request),
  );

  /**
   * Pauses a profile.
   */
  pauseProfileWorkflow = unary<personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse>(
    (request) => this.workflow.pauseProfileWorkflow(request),
  );

  /**
   * Resumes a profile.
   */
  resumeProfileWorkflow = (call: ServerUnaryCall<personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse>, done: sendUnaryData<personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse>): void => {
    void this.workflow.resumeProfileWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a profile.
   */
  retryProfileWorkflow = unary<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse>(
    (request) => this.workflow.retryProfileWorkflow(request),
  );

  /**
   * Signals a profile.
   */
  signalProfileWorkflow = unary<personalizationProfileWorkflowServiceApi.SignalProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse>(
    (request) => this.workflow.signalProfileWorkflow(request),
  );

  /**
   * Starts a profile.
   */
  startProfileWorkflow = (call: ServerUnaryCall<personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse>, done: sendUnaryData<personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse>): void => {
    void this.workflow.startProfileWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ProfileWorkflowHandler): personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceServer {
  return {
    advanceProfileWorkflow: handler.advanceProfileWorkflow,
    cancelProfileWorkflow: handler.cancelProfileWorkflow,
    inspectProfileWorkflow: handler.inspectProfileWorkflow,
    pauseProfileWorkflow: handler.pauseProfileWorkflow,
    resumeProfileWorkflow: handler.resumeProfileWorkflow,
    retryProfileWorkflow: handler.retryProfileWorkflow,
    signalProfileWorkflow: handler.signalProfileWorkflow,
    startProfileWorkflow: handler.startProfileWorkflow,
  };
}
