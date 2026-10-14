/**
 * Runs the long-lived workflow that takes an audience sync from start to finish.
 */

import * as audiencesAudienceSyncWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AudienceSyncWorkflowWorkflow } from "../application/audience-sync-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceSyncWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceSyncWorkflowHandler {
  constructor(@inject(AudienceSyncWorkflowWorkflow) private readonly workflow: AudienceSyncWorkflowWorkflow) {}

  /**
   * Advances an audience sync.
   */
  advanceAudienceSyncWorkflow = (call: ServerUnaryCall<audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse>, done: sendUnaryData<audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse>): void => {
    void this.workflow.advanceAudienceSyncWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists audience syncs a page at a time.
   */
  listAudienceSyncWorkflows = unary<audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest, audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse>(
    (request) => this.workflow.listAudienceSyncWorkflows(request),
  );

  /**
   * Pauses an audience sync.
   */
  pauseAudienceSyncWorkflow = unary<audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowResponse>(
    (request) => this.workflow.pauseAudienceSyncWorkflow(request),
  );

  /**
   * Resumes an audience sync.
   */
  resumeAudienceSyncWorkflow = (call: ServerUnaryCall<audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse>, done: sendUnaryData<audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse>): void => {
    void this.workflow.resumeAudienceSyncWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys an audience sync.
   */
  retryAudienceSyncWorkflow = unary<audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse>(
    (request) => this.workflow.retryAudienceSyncWorkflow(request),
  );

  /**
   * Signals an audience sync.
   */
  signalAudienceSyncWorkflow = unary<audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowResponse>(
    (request) => this.workflow.signalAudienceSyncWorkflow(request),
  );

  /**
   * Starts an audience sync.
   */
  startAudienceSyncWorkflow = (call: ServerUnaryCall<audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowResponse>, done: sendUnaryData<audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowResponse>): void => {
    void this.workflow.startAudienceSyncWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AudienceSyncWorkflowHandler): audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceServer {
  return {
    advanceAudienceSyncWorkflow: handler.advanceAudienceSyncWorkflow,
    listAudienceSyncWorkflows: handler.listAudienceSyncWorkflows,
    pauseAudienceSyncWorkflow: handler.pauseAudienceSyncWorkflow,
    resumeAudienceSyncWorkflow: handler.resumeAudienceSyncWorkflow,
    retryAudienceSyncWorkflow: handler.retryAudienceSyncWorkflow,
    signalAudienceSyncWorkflow: handler.signalAudienceSyncWorkflow,
    startAudienceSyncWorkflow: handler.startAudienceSyncWorkflow,
  };
}
